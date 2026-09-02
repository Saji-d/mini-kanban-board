import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { registerUser, TestUser } from './utils/auth-helpers';
import { createTestApp, resetDatabase } from './utils/test-app';

describe('Task ordering (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: TestUser;
  let boardId: string;
  let todoId: string;
  let doingId: string;

  const http = () => app.getHttpServer();
  const auth = () => `Bearer ${user.accessToken}`;

  async function createTask(columnId: string, title: string) {
    const res = await request(http())
      .post(`/boards/${boardId}/tasks`)
      .set('Authorization', auth())
      .send({ columnId, title })
      .expect(201);
    return res.body;
  }

  async function orderedTitles(columnId: string) {
    const res = await request(http())
      .get(`/boards/${boardId}/tasks`)
      .set('Authorization', auth())
      .expect(200);
    return res.body
      .filter((t: any) => t.columnId === columnId)
      .sort((a: any, b: any) => a.position - b.position)
      .map((t: any) => t.title);
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    user = await registerUser(app, 'orderer');

    const board = await request(http())
      .post('/boards')
      .set('Authorization', auth())
      .send({ title: 'Ordering board' })
      .expect(201);
    boardId = board.body.id;

    const todo = await request(http())
      .post(`/boards/${boardId}/columns`)
      .set('Authorization', auth())
      .send({ name: 'Todo' })
      .expect(201);
    todoId = todo.body.id;

    const doing = await request(http())
      .post(`/boards/${boardId}/columns`)
      .set('Authorization', auth())
      .send({ name: 'Doing' })
      .expect(201);
    doingId = doing.body.id;
  });

  it('reorders within the same column', async () => {
    await createTask(todoId, 'A');
    const t2 = await createTask(todoId, 'B');
    const t3 = await createTask(todoId, 'C');
    expect(await orderedTitles(todoId)).toEqual(['A', 'B', 'C']);

    await request(http())
      .patch(`/boards/${boardId}/tasks/${t3.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: todoId, targetIndex: 0 })
      .expect(200);
    expect(await orderedTitles(todoId)).toEqual(['C', 'A', 'B']);

    await request(http())
      .patch(`/boards/${boardId}/tasks/${t2.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: todoId, targetIndex: 1 })
      .expect(200);
    expect(await orderedTitles(todoId)).toEqual(['C', 'B', 'A']);
  });

  it('moves a task to the beginning, middle, and end of another column', async () => {
    const a = await createTask(todoId, 'A');
    await createTask(doingId, 'X');
    await createTask(doingId, 'Y');

    await request(http())
      .patch(`/boards/${boardId}/tasks/${a.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: doingId, targetIndex: 1 })
      .expect(200);
    expect(await orderedTitles(doingId)).toEqual(['X', 'A', 'Y']);
    expect(await orderedTitles(todoId)).toEqual([]);
  });

  it('moves a task into an empty column', async () => {
    const a = await createTask(todoId, 'A');

    await request(http())
      .patch(`/boards/${boardId}/tasks/${a.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: doingId, targetIndex: 0 })
      .expect(200);

    expect(await orderedTitles(doingId)).toEqual(['A']);
  });

  it('is a no-op when moved to its current position', async () => {
    await createTask(todoId, 'A');
    const b = await createTask(todoId, 'B');
    await createTask(todoId, 'C');

    const before = await prisma.task.findUnique({ where: { id: b.id } });

    await request(http())
      .patch(`/boards/${boardId}/tasks/${b.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: todoId, targetIndex: 1 })
      .expect(200);

    const after = await prisma.task.findUnique({ where: { id: b.id } });
    expect(after!.position).toBe(before!.position);
    expect(after!.updatedAt.getTime()).toBe(before!.updatedAt.getTime());
  });

  it('clamps an out-of-range target index instead of rejecting it', async () => {
    const a = await createTask(todoId, 'A');
    await createTask(doingId, 'X');

    await request(http())
      .patch(`/boards/${boardId}/tasks/${a.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: doingId, targetIndex: 999 })
      .expect(200);
    expect(await orderedTitles(doingId)).toEqual(['X', 'A']);

    await request(http())
      .patch(`/boards/${boardId}/tasks/${a.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: doingId, targetIndex: -50 })
      .expect(200);
    expect(await orderedTitles(doingId)).toEqual(['A', 'X']);
  });

  it('rejects a non-integer target index and a nonexistent destination column', async () => {
    const a = await createTask(todoId, 'A');

    await request(http())
      .patch(`/boards/${boardId}/tasks/${a.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: doingId, targetIndex: 1.5 })
      .expect(400);

    await request(http())
      .patch(`/boards/${boardId}/tasks/${a.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: 'does-not-exist', targetIndex: 0 })
      .expect(404);
  });

  it('renormalizes positions when repeated inserts exhaust float precision between two neighbors', async () => {
    const a = await createTask(todoId, 'A');
    const b = await createTask(todoId, 'B');

    // Force A and B's positions to be nearly identical, simulating what many
    // repeated insertions at the same slot would eventually produce.
    await prisma.task.update({ where: { id: a.id }, data: { position: 1.0 } });
    await prisma.task.update({
      where: { id: b.id },
      data: { position: 1.00000005 },
    });

    const c = await createTask(todoId, 'C');
    await prisma.task.update({ where: { id: c.id }, data: { position: 1000 } });

    // Move C between A and B - this must trigger renormalization internally
    // and still produce a correct, strictly increasing order afterward.
    await request(http())
      .patch(`/boards/${boardId}/tasks/${c.id}/move`)
      .set('Authorization', auth())
      .send({ destinationColumnId: todoId, targetIndex: 1 })
      .expect(200);

    expect(await orderedTitles(todoId)).toEqual(['A', 'C', 'B']);

    const rows = await prisma.task.findMany({
      where: { columnId: todoId },
      orderBy: { position: 'asc' },
    });
    const positions = rows.map((r) => r.position);
    expect(new Set(positions).size).toBe(positions.length); // all distinct
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});

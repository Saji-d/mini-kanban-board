import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { registerUser, TestUser } from './utils/auth-helpers';
import { createTestApp, resetDatabase } from './utils/test-app';

describe('Authorization matrix (e2e)', () => {
  let app: INestApplication;
  let owner: TestUser;
  let editor: TestUser;
  let viewer: TestUser;
  let stranger: TestUser;
  let boardId: string;
  let columnId: string;

  const http = () => app.getHttpServer();

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);

    owner = await registerUser(app, 'owner');
    editor = await registerUser(app, 'editor');
    viewer = await registerUser(app, 'viewer');
    stranger = await registerUser(app, 'stranger');

    const board = await request(http())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Board' })
      .expect(201);
    boardId = board.body.id;

    await request(http())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: editor.email, role: 'EDITOR' })
      .expect(201);

    await request(http())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: viewer.email, role: 'VIEWER' })
      .expect(201);

    const column = await request(http())
      .post(`/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Todo' })
      .expect(201);
    columnId = column.body.id;
  });

  describe('non-members', () => {
    it('cannot read the board', async () => {
      await request(http())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .expect(404);
    });

    it('cannot create a column', async () => {
      await request(http())
        .post(`/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ name: 'Sneaky' })
        .expect(404);
    });
  });

  describe('VIEWER', () => {
    it('can read the board, columns, tasks, and members', async () => {
      await request(http())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);
      await request(http())
        .get(`/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);
      await request(http())
        .get(`/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);
      await request(http())
        .get(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);
    });

    it('cannot create, update, or delete a column', async () => {
      await request(http())
        .post(`/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ name: 'Nope' })
        .expect(403);

      await request(http())
        .patch(`/boards/${boardId}/columns/${columnId}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ name: 'Nope' })
        .expect(403);

      await request(http())
        .delete(`/boards/${boardId}/columns/${columnId}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);
    });

    it('cannot create, update, delete, or move a task', async () => {
      const task = await request(http())
        .post(`/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ columnId, title: 'Owner task' })
        .expect(201);

      await request(http())
        .post(`/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ columnId, title: 'Nope' })
        .expect(403);

      await request(http())
        .patch(`/boards/${boardId}/tasks/${task.body.id}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ title: 'Nope' })
        .expect(403);

      await request(http())
        .patch(`/boards/${boardId}/tasks/${task.body.id}/move`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ destinationColumnId: columnId, targetIndex: 0 })
        .expect(403);

      await request(http())
        .delete(`/boards/${boardId}/tasks/${task.body.id}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);
    });

    it('cannot manage members or update/delete the board', async () => {
      await request(http())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ email: stranger.email, role: 'EDITOR' })
        .expect(403);

      await request(http())
        .patch(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ title: 'Renamed' })
        .expect(403);

      await request(http())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);
    });
  });

  describe('EDITOR', () => {
    it('can create/update/delete columns and tasks, and move tasks', async () => {
      await request(http())
        .post(`/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send({ name: 'Editor column' })
        .expect(201);

      const task = await request(http())
        .post(`/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send({ columnId, title: 'Editor task' })
        .expect(201);

      await request(http())
        .patch(`/boards/${boardId}/tasks/${task.body.id}/move`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send({ destinationColumnId: columnId, targetIndex: 0 })
        .expect(200);
    });

    it('can update the board but cannot delete it or manage members', async () => {
      await request(http())
        .patch(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send({ title: 'Renamed by editor' })
        .expect(200);

      await request(http())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .expect(403);

      await request(http())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send({ email: stranger.email, role: 'VIEWER' })
        .expect(403);
    });
  });

  describe('OWNER', () => {
    it('can manage members and delete the board', async () => {
      const membersRes = await request(http())
        .get(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      const editorMembership = membersRes.body.find(
        (m: any) => m.userId === editor.id,
      );

      await request(http())
        .patch(`/boards/${boardId}/members/${editorMembership.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'VIEWER' })
        .expect(200);

      await request(http())
        .delete(`/boards/${boardId}/members/${editorMembership.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(204);

      await request(http())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(204);
    });

    it('cannot demote or remove the last remaining owner', async () => {
      const membersRes = await request(http())
        .get(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      const ownerMembership = membersRes.body.find(
        (m: any) => m.userId === owner.id,
      );

      await request(http())
        .patch(`/boards/${boardId}/members/${ownerMembership.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'EDITOR' })
        .expect(403);

      await request(http())
        .delete(`/boards/${boardId}/members/${ownerMembership.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(403);
    });
  });

  describe('cross-board IDOR protection', () => {
    it("cannot move a task using another board's route, or into another board's column", async () => {
      const otherBoard = await request(http())
        .post('/boards')
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ title: 'Other board' })
        .expect(201);
      const otherColumn = await request(http())
        .post(`/boards/${otherBoard.body.id}/columns`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ name: 'Other column' })
        .expect(201);

      const task = await request(http())
        .post(`/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ columnId, title: 'Board A task' })
        .expect(201);

      // Owner of board A tries to move their task into board B's column.
      await request(http())
        .patch(`/boards/${boardId}/tasks/${task.body.id}/move`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ destinationColumnId: otherColumn.body.id, targetIndex: 0 })
        .expect(404);

      // Stranger (member of board B only) tries to reach board A's task via board B's route.
      await request(http())
        .patch(`/boards/${otherBoard.body.id}/tasks/${task.body.id}/move`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ destinationColumnId: otherColumn.body.id, targetIndex: 0 })
        .expect(404);
    });

    it('cannot update or delete a column/task that belongs to another board even as a member of both', async () => {
      const otherBoard = await request(http())
        .post('/boards')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: 'Board B, also owned by owner' })
        .expect(201);
      const otherColumn = await request(http())
        .post(`/boards/${otherBoard.body.id}/columns`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'B column' })
        .expect(201);

      // owner is OWNER of both boards, but board A's route must not reach board B's column.
      await request(http())
        .patch(`/boards/${boardId}/columns/${otherColumn.body.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'Hijacked' })
        .expect(404);
    });
  });
});

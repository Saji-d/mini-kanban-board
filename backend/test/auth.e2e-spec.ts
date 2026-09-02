import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user and returns an access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice@example.com',
        password: 'password123',
        name: 'Alice',
      })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: 'alice@example.com',
      name: 'Alice',
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects registering the same email twice', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'bob@example.com', password: 'password123', name: 'Bob' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'bob@example.com',
        password: 'password123',
        name: 'Bob Again',
      })
      .expect(409);
  });

  it('rejects registration with an invalid email or short password', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'X' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'valid@example.com', password: 'short', name: 'X' })
      .expect(400);
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'carol@example.com',
        password: 'password123',
        name: 'Carol',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'carol@example.com', password: 'password123' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'carol@example.com', password: 'wrong' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })
      .expect(401);
  });

  it('rejects a request with no bearer token and one with a garbage token', async () => {
    await request(app.getHttpServer()).get('/boards').expect(401);
    await request(app.getHttpServer())
      .get('/boards')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });
});

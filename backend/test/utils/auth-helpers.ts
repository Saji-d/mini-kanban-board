import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
}

let counter = 0;

export async function registerUser(
  app: INestApplication,
  namePrefix = 'user',
): Promise<TestUser> {
  counter += 1;
  const email = `${namePrefix}${counter}_${Date.now()}@example.com`;
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'password123', name: namePrefix })
    .expect(201);

  return {
    id: res.body.user.id,
    email: res.body.user.email,
    accessToken: res.body.accessToken,
  };
}

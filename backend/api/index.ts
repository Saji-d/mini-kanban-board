import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/create-app';

// Vercel serverless entrypoint. Bootstraps Nest once per warm lambda
// instance (cached across invocations) instead of per-request, and reuses
// the same route handling (guards, pipes, CORS, Swagger) as the local/
// Docker entrypoint via configureApp. Migrations are NOT run here - they
// are applied out-of-band (`prisma migrate deploy`) before/at deploy time,
// never on a request path.
const server = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureApp(app);
  await app.init();
}

export default async function handler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!bootstrapped) {
    bootstrapped = bootstrap();
  }
  await bootstrapped;
  server(req, res);
}

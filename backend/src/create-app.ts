import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Shared app configuration used by both the local/Docker entrypoint (main.ts) and the Vercel serverless entrypoint (api/index.ts). */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: configService
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(','),
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini Kanban Board API')
    .setDescription(
      'Boards, columns, tasks, sharing and drag-and-drop ordering',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
}

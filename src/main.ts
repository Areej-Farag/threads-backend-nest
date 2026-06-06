// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const availableOrgins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://threads-clone-frontend.vercel.app',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS للـ Next.js frontend
  app.enableCors({
    origin: availableOrgins || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Threads Clone API')
    .setDescription('REST API for Threads Clone')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 4000);
  console.log(
    `Backend running on http://localhost:${process.env.PORT ?? 4000}`,
  );
  console.log(
    `Swagger docs on http://localhost:${process.env.PORT ?? 4000}/api/docs`,
  );
}
bootstrap();

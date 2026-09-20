import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(prefix);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('School SaaS API')
    .setDescription(
      'Multi-Tenant School Management & RFID Attendance Platform API Documentation',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication, Token Management, and School Registration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    customSiteTitle: 'School SaaS API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API is running on http://localhost:${port}/${prefix}`);
  console.log(`📚 Swagger Documentation is available on http://localhost:${port}/${prefix}/docs`);
}
bootstrap();

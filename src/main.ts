import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

// Capture errors that happen before NestJS initializes its logger.
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

async function bootstrap() {
  try {
    console.log('🚀 Iniciando aplicación...');
    console.log('PORT:', process.env.PORT);
    console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // API configuration
    app.setGlobalPrefix('api');
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Uploaded files stored locally; UPLOADS_DIR can override the default directory.
    app.useStaticAssets(join(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads'), {
      prefix: '/uploads',
    });

    // Swagger documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Trendy API')
      .setDescription('Marketplace hiperlocal de segunda mano')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en /api/user/login',
        },
        'JWT-auth',
      )
      .build();

    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Application is running on port ${port}`);
  } catch (error) {
    console.error('❌ Error fatal durante el arranque:');
    console.error(error);
    process.exit(1);
  }
}

void bootstrap();

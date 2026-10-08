import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Captura errores que ocurren antes de que NestJS inicialice su logger
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

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.enableCors();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Application is running on port ${port}`);
  } catch (error) {
    console.error('❌ Error fatal durante el arranque:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
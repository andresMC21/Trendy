import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const ssl =
          config.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false;
        return {
          type: 'postgres' as const,
          ...(url
            ? { url }
            : {
                host: config.get<string>('DB_HOST'),
                port: Number(config.get<string>('DB_PORT') ?? 5432),
                database: config.get<string>('DB_NAME'),
                username: config.get<string>('DB_USERNAME'),
                password: config.get<string>('DB_PASSWORD'),
              }),
          ssl,
          autoLoadEntities: true,
          // En Render se deja en true para crear las tablas la primera vez.
          synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
        };
      },
    }),
    UserModule,
    TransactionModule,
    ProductModule,
    ReviewModule,
  ],
})
export class AppModule {}

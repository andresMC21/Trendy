import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const nodeEnv = config.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';

        // Supports both names used by the two original configurations.
        const synchronizeSetting =
          config.get<string>('DB_SYNCHRONIZE') ??
          config.get<string>('TYPEORM_SYNCHRONIZE');
        const synchronize = synchronizeSetting
          ? synchronizeSetting === 'true'
          : !isProduction;

        // DB_SSL explicitly overrides the environment-based default.
        const sslSetting = config.get<string>('DB_SSL');
        const ssl =
          sslSetting !== undefined
            ? sslSetting === 'true'
              ? { rejectUnauthorized: false }
              : false
            : isProduction
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
          synchronize,
        };
      },
    }),
    UserModule,
    TransactionModule,
    ProductModule,
    ReviewModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserController } from './user.controller';
import { AdminUserController } from './admin-user.controller';
import { ModerationController } from './moderation.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [UserController, AdminUserController, ModerationController],
  providers: [UserService, JwtStrategy],
  // Otros módulos (product, transaction) importan UserModule para usar @Auth()
  exports: [TypeOrmModule, PassportModule, JwtModule, JwtStrategy, UserService],
})
export class UserModule { }

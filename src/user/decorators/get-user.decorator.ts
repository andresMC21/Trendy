import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../entities/user.entity';

/** Devuelve el usuario que Passport dejó en `request.user` (requiere @Auth()). */
export const GetUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();

    if (!user) {
      throw new InternalServerErrorException(
        'User not found in request (is the route missing @Auth()?)',
      );
    }

    return user;
  },
);

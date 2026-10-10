import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new InternalServerErrorException("User doesn't exist");
    return data ? user[data] : user;
  },
);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { META_ROLES } from '../../decorators/role-protected/role-protected.decorator';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const validRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      META_ROLES,
      [context.getHandler(), context.getClass()],
    );
    if (!validRoles || validRoles.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    if (!user) throw new UnauthorizedException();

    if (user.role?.some((r) => validRoles.includes(r))) return true;
    throw new ForbiddenException('No tiene permisos para este recurso');
  }
}

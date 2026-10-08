import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidRoles } from '../../enums/valid-roles.enum';
import { User } from '../../entities/user.entity';
import { META_ROLES } from '../../decorators/role-protected/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ValidRoles[]>(
      META_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const userRoles = user.role ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `User needs one of these roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

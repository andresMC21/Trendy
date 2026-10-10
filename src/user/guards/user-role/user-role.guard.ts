import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { META_ROLES } from '../../decorators/role-protected/role-protected.decorator';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const validRoles: string[] | undefined = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );
    if (!validRoles || validRoles.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as User | undefined;
    if (!user) throw new BadRequestException('user not found');

    if (user.role?.some((r) => validRoles.includes(r))) return true;
    throw new ForbiddenException(
      `User ${user.fullName} needs one of these roles: ${validRoles.join(', ')}`,
    );
  }
}

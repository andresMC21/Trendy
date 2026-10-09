import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ValidRoles } from '../enums/valid-roles.enum';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { RoleProtected } from './role-protected/role-protected.decorator';

/** Exige JWT válido y, opcionalmente, alguno de los roles indicados. */
export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Falta el JWT o es inválido' }),
    ApiForbiddenResponse({
      description: roles.length
        ? `Requiere alguno de estos roles: ${roles.join(', ')}`
        : 'Sin permiso',
    }),
  );
}

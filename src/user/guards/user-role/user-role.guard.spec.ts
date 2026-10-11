import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../entities/user.entity';
import { ValidRoles } from '../../enums/valid-roles.enum';
import { UserRoleGuard } from './user-role.guard';

const makeContext = (user?: Partial<User>): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('UserRoleGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: UserRoleGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new UserRoleGuard(reflector as unknown as Reflector);
  });

  it('permite el acceso si la ruta no declara roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('permite el acceso si el usuario tiene un rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue([ValidRoles.ADMIN]);

    expect(
      guard.canActivate(
        makeContext({ role: [ValidRoles.USER, ValidRoles.ADMIN] }),
      ),
    ).toBe(true);
  });

  it('lanza 401 si la ruta requiere roles y no hay usuario autenticado', () => {
    reflector.getAllAndOverride.mockReturnValue([ValidRoles.ADMIN]);

    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('lanza 403 si el usuario no tiene un rol permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([ValidRoles.ADMIN]);

    expect(() =>
      guard.canActivate(makeContext({ role: [ValidRoles.USER] })),
    ).toThrow(ForbiddenException);
  });
});

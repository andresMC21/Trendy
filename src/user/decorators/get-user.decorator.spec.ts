import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { GetUser } from './get-user.decorator';

class TestController {
  test(@GetUser() _user: unknown) {
    return undefined;
  }
}

const getDecoratorFactory = () => {
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  );
  const entry = Object.values(metadata)[0] as {
    factory: (data: unknown, context: ExecutionContext) => unknown;
  };
  return entry.factory;
};

const makeContext = (user?: unknown): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('GetUser decorator', () => {
  it('retorna el usuario autenticado del request', () => {
    const user = { id: 'user-1' };

    expect(getDecoratorFactory()(undefined, makeContext(user))).toBe(user);
  });

  it('lanza error si la ruta no tiene usuario en request', () => {
    expect(() => getDecoratorFactory()(undefined, makeContext())).toThrow(
      InternalServerErrorException,
    );
  });
});

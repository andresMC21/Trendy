import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const userRepository = {
    findOneBy: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const build = () => new JwtStrategy(userRepository as never, configService);

  it('busca el usuario por id del payload y lo retorna si esta activo', async () => {
    const user = {
      id: 'user-1',
      email: 'ana@example.com',
      isActive: true,
    } as User;
    userRepository.findOneBy.mockResolvedValue(user);

    await expect(
      build().validate({ id: 'user-1', email: 'ana@example.com' }),
    ).resolves.toBe(user);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('rechaza tokens cuyo usuario no existe', async () => {
    userRepository.findOneBy.mockResolvedValue(null);

    await expect(
      build().validate({ id: 'missing', email: 'x@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza usuarios inactivos', async () => {
    userRepository.findOneBy.mockResolvedValue({
      id: 'user-1',
      isActive: false,
    });

    await expect(
      build().validate({ id: 'user-1', email: 'ana@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

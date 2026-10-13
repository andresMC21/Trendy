import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt.interface';
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
  const payload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
    id: 'user-1',
    email: 'ana@example.com',
    tokenVersion: 0,
    ...overrides,
  });

  it('busca el usuario por id del payload y lo retorna si esta activo y la version coincide', async () => {
    // Arrange
    const user = {
      id: 'user-1',
      email: 'ana@example.com',
      isActive: true,
      tokenVersion: 0,
    } as User;
    userRepository.findOneBy.mockResolvedValue(user);

    // Act / Assert
    await expect(build().validate(payload())).resolves.toBe(user);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('rechaza tokens cuyo usuario no existe', async () => {
    // Arrange
    userRepository.findOneBy.mockResolvedValue(null);

    // Act / Assert
    await expect(
      build().validate(payload({ id: 'missing' })),
    ).rejects.toThrow('Token not valid');
  });

  it('rechaza usuarios inactivos', async () => {
    // Arrange
    userRepository.findOneBy.mockResolvedValue({
      id: 'user-1',
      isActive: false,
      tokenVersion: 0,
    });

    // Act / Assert
    await expect(build().validate(payload())).rejects.toThrow(
      'User is not active',
    );
  });

  describe('sesión cerrada (tokenVersion)', () => {
    it('rechaza un token emitido antes del cierre de sesión (la versión del usuario ya subió)', async () => {
      // Arrange: el usuario hizo logout una vez -> versión 1; el token es de la versión 0
      userRepository.findOneBy.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        tokenVersion: 1,
      });

      // Act / Assert
      await expect(
        build().validate(payload({ tokenVersion: 0 })),
      ).rejects.toThrow('Invalid token');
    });

    it('rechaza tokens de varias sesiones anteriores tras cerrar sesión varias veces', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        tokenVersion: 5,
      });

      // Act / Assert
      for (const old of [0, 1, 4]) {
        await expect(
          build().validate(payload({ tokenVersion: old })),
        ).rejects.toBeInstanceOf(UnauthorizedException);
      }
    });

    it('acepta el token emitido después del último cierre de sesión', async () => {
      // Arrange
      const user = { id: 'user-1', isActive: true, tokenVersion: 5 } as User;
      userRepository.findOneBy.mockResolvedValue(user);

      // Act / Assert
      await expect(
        build().validate(payload({ tokenVersion: 5 })),
      ).resolves.toBe(user);
    });

    it('rechaza un token con una versión mayor a la del usuario (token adelantado o manipulado)', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        tokenVersion: 1,
      });

      // Act / Assert
      await expect(
        build().validate(payload({ tokenVersion: 2 })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza tokens sin tokenVersion (emitidos antes de existir el cierre de sesión)', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        tokenVersion: 0,
      });
      const legacy = { id: 'user-1', email: 'ana@example.com' } as JwtPayload;

      // Act / Assert
      await expect(build().validate(legacy)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('un usuario inactivo se rechaza por inactivo aunque la versión coincida', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue({
        id: 'user-1',
        isActive: false,
        tokenVersion: 0,
      });

      // Act / Assert
      await expect(build().validate(payload())).rejects.toThrow(
        'User is not active',
      );
    });
  });
});

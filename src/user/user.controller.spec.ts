import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    create: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    findMe: jest.fn(),
    updateMe: jest.fn(),
    changePassword: jest.fn(),
    changeEmail: jest.fn(),
    requestVerification: jest.fn(),
    findPublicProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    // Assert
    expect(controller).toBeDefined();
  });

  it('uses 200 for POST operations that do not create a resource', () => {
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, UserController.prototype.login),
    ).toBe(200);
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        UserController.prototype.requestVerification,
      ),
    ).toBe(200);
  });

  it('logout responde 200 y exige autenticación, mientras que login es público', () => {
    // Assert
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, UserController.prototype.logout),
    ).toBe(200);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, UserController.prototype.logout),
    ).toHaveLength(2); // AuthGuard (JWT) + UserRoleGuard
    expect(
      Reflect.getMetadata(GUARDS_METADATA, UserController.prototype.login),
    ).toBeUndefined();
  });

  it('logout delega al servicio con el usuario autenticado', async () => {
    // Arrange
    const user = { id: 'u1' } as never;
    userService.logout.mockResolvedValue({ message: 'Session successfully closed' });

    // Act
    const result = await controller.logout(user);

    // Assert
    expect(result).toEqual({ message: 'Session successfully closed' });
    expect(userService.logout).toHaveBeenCalledTimes(1);
    expect(userService.logout).toHaveBeenCalledWith(user);
  });

  it('register delega al servicio', async () => {
    // Arrange
    const dto = {
      email: 'ana@example.com',
      password: 'Password1',
      fullName: 'Ana',
    };
    userService.create.mockResolvedValue('created');

    // Act
    const result = await controller.register(dto);

    // Assert
    expect(result).toBe('created');
    expect(userService.create).toHaveBeenCalledWith(dto);
  });

  it('login delega al servicio', async () => {
    // Arrange
    const dto = { email: 'ana@example.com', password: 'Password1' };
    userService.login.mockResolvedValue('logged');

    // Act
    const result = await controller.login(dto);

    // Assert
    expect(result).toBe('logged');
    expect(userService.login).toHaveBeenCalledWith(dto);
  });

  it('findMe usa el usuario autenticado', () => {
    // Arrange
    const user = { id: 'u1' } as any;
    userService.findMe.mockReturnValue('me');

    // Act
    const result = controller.findMe(user);

    // Assert
    expect(result).toBe('me');
    expect(userService.findMe).toHaveBeenCalledWith(user);
  });

  it('updateMe delega usuario y dto', async () => {
    // Arrange
    const user = { id: 'u1' } as any;
    const dto = { info: 'bio' };
    userService.updateMe.mockResolvedValue('updated');

    // Act
    const result = await controller.updateMe(user, dto);

    // Assert
    expect(result).toBe('updated');
    expect(userService.updateMe).toHaveBeenCalledWith(user, dto);
  });

  it('changePassword y changeEmail delegan al servicio', async () => {
    // Arrange
    const user = { id: 'u1' } as any;
    const passwordDto = {
      currentPassword: 'Password1',
      newPassword: 'Password2',
    };
    const emailDto = {
      currentPassword: 'Password1',
      newEmail: 'new@example.com',
    };
    userService.changePassword.mockResolvedValue('password');
    userService.changeEmail.mockResolvedValue('email');

    // Act
    const passwordResult = await controller.changePassword(user, passwordDto);
    const emailResult = await controller.changeEmail(user, emailDto);

    // Assert
    expect(passwordResult).toBe('password');
    expect(emailResult).toBe('email');
    expect(userService.changePassword).toHaveBeenCalledWith(user, passwordDto);
    expect(userService.changeEmail).toHaveBeenCalledWith(user, emailDto);
  });

  it('requestVerification y findOne delegan al servicio', async () => {
    // Arrange
    const user = { id: 'u1' } as any;
    userService.requestVerification.mockResolvedValue('pending');
    userService.findPublicProfile.mockResolvedValue('profile');

    // Act
    const verification = await controller.requestVerification(user);
    const profile = await controller.findOne('u2');

    // Assert
    expect(verification).toBe('pending');
    expect(profile).toBe('profile');
    expect(userService.requestVerification).toHaveBeenCalledWith(user);
    expect(userService.findPublicProfile).toHaveBeenCalledWith('u2');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { VerificationStatus } from './enums/verification-status';
import { UserService } from './user.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'ana@example.com',
    password: 'hash',
    fullName: 'Ana Gomez',
    tokenVersion: 0,
    info: 'Vendedora local',
    verificationStatus: VerificationStatus.UNVERIFIED,
    ratingAverage: 4.5,
    reviewsCount: 2,
    isActive: true,
    role: [ValidRoles.USER],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-02T10:00:00Z'),
    ...overrides,
  }) as User;

const makeQb = () => {
  const qb: any = {};
  ['select', 'andWhere', 'orderBy', 'skip', 'take'].forEach(
    (method) => (qb[method] = jest.fn().mockReturnValue(qb)),
  );
  qb.getManyAndCount = jest.fn().mockResolvedValue([[makeUser()], 1]);
  return qb;
};

describe('UserService', () => {
  let service: UserService;
  let qb: ReturnType<typeof makeQb>;
  const userRepository: any = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    preload: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = makeQb();
    Object.assign(userRepository, {
      create: jest.fn((value) => ({ id: 'user-1', ...value })),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      preload: jest.fn(async (value) => makeUser(value)),
      update: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    });
    jwtService.sign.mockReturnValue('signed-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('hashea la contrasena, guarda el usuario y devuelve token sin password', async () => {
      // Arrange
      const dto = {
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      };

      // Act
      const result = await service.create(dto);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ana@example.com',
          fullName: 'Ana Gomez',
          password: expect.any(String),
        }),
      );
      const savedPassword = userRepository.create.mock.calls[0][0].password;
      expect(savedPassword).not.toBe(dto.password);
      await expect(bcrypt.compare(dto.password, savedPassword)).resolves.toBe(
        true,
      );
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'ana@example.com',
        token: 'signed-token',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('convierte duplicados de base de datos en ConflictException', async () => {
      // Arrange
      userRepository.save.mockRejectedValue({ code: '23505' });

      // Act
      const result = service.create({
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      });

      // Assert
      await expect(result).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('devuelve token cuando credenciales y estado son validos', async () => {
      // Arrange
      const password = await bcrypt.hash('Password1', 4);
      userRepository.findOne.mockResolvedValue(makeUser({ password }));

      // Act
      const result = await service.login({
        email: 'ana@example.com',
        password: 'Password1',
      });

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'ana@example.com' },
        select: { id: true, email: true, password: true, isActive: true, tokenVersion: true },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'ana@example.com',
        token: 'signed-token',
      });
    });

    it('rechaza usuario inexistente, inactivo o password incorrecta con el mismo error', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValueOnce(null);

      // Act / Assert
      await expect(
        service.login({ email: 'none@example.com', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      userRepository.findOne.mockResolvedValueOnce(
        makeUser({
          isActive: false,
          password: await bcrypt.hash('Password1', 4),
        }),
      );
      await expect(
        service.login({ email: 'ana@example.com', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      userRepository.findOne.mockResolvedValueOnce(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );
      await expect(
        service.login({ email: 'ana@example.com', password: 'WrongPass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('profile', () => {
    it('findMe no expone password y conserva info', () => {
      // Arrange
      const user = makeUser();

      // Act
      const result = service.findMe(user);

      // Assert
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'ana@example.com',
        info: 'Vendedora local',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('updateMe bloquea cambio de nombre si esta verificado o pendiente', async () => {
      // Arrange
      const verified = makeUser({
        verificationStatus: VerificationStatus.VERIFIED,
      });
      const pending = makeUser({
        verificationStatus: VerificationStatus.PENDING,
      });

      // Act / Assert
      await expect(
        service.updateMe(verified, { fullName: 'Nuevo Nombre' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.updateMe(pending, { fullName: 'Nuevo Nombre' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updateMe actualiza campos permitidos', async () => {
      // Arrange
      const user = makeUser();

      // Act
      const result = await service.updateMe(user, {
        fullName: 'Ana Actualizada',
        info: 'Nueva bio',
      });

      // Assert
      expect(userRepository.preload).toHaveBeenCalledWith({
        id: 'user-1',
        fullName: 'Ana Actualizada',
        info: 'Nueva bio',
      });
      expect(result.info).toBe('Nueva bio');
    });

    it('updateMe devuelve 404 si preload no encuentra el usuario', async () => {
      // Arrange
      userRepository.preload.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.updateMe(makeUser(), { info: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('findPublicProfile devuelve solo usuarios activos', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());

      // Act
      const result = await service.findPublicProfile('user-1');

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 'user-1',
        isActive: true,
      });
      expect(result.id).toBe('user-1');
    });

    it('findPublicProfile devuelve 404 si no existe usuario activo', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findPublicProfile('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findProfile busca por email normalizado, luego por nombre y puede devolver undefined', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(makeUser());

      // Act
      const byEmail = await service.findProfile({ email: ' ANA@EXAMPLE.COM ' });

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'ana@example.com',
      });
      expect(byEmail?.id).toBe('user-1');

      userRepository.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeUser());
      const byName = await service.findProfile({
        email: 'missing@example.com',
        fullName: 'Ana Gomez',
      });
      expect(byName?.id).toBe('user-1');

      userRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.findProfile({ fullName: 'Nadie' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('security changes', () => {
    it('changePassword valida password actual y rechaza reutilizarla', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act / Assert
      await expect(
        service.changePassword(makeUser(), {
          currentPassword: 'Password1',
          newPassword: 'Password1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('changePassword actualiza hash si la password actual coincide', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act
      const result = await service.changePassword(makeUser(), {
        currentPassword: 'Password1',
        newPassword: 'Password2',
      });

      // Assert
      expect(result).toEqual({ message: 'Password updated successfully' });
      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        password: expect.any(String),
      });
    });

    it('changePassword y changeEmail rechazan password actual incorrecta', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act / Assert
      await expect(
        service.changePassword(makeUser(), {
          currentPassword: 'bad',
          newPassword: 'Password2',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.changeEmail(makeUser(), {
          currentPassword: 'bad',
          newEmail: 'new@example.com',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('changeEmail normaliza, valida diferencia y devuelve perfil actualizado', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );
      userRepository.findOneBy.mockResolvedValue(
        makeUser({ email: 'new@example.com' }),
      );

      // Act
      const result = await service.changeEmail(makeUser(), {
        currentPassword: 'Password1',
        newEmail: ' NEW@EXAMPLE.COM ',
      });

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        email: 'new@example.com',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('changeEmail rechaza usar el mismo email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act / Assert
      await expect(
        service.changeEmail(makeUser(), {
          currentPassword: 'Password1',
          newEmail: ' ana@example.com ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('admin queries', () => {
    it('findAll aplica filtros, busqueda escapada y paginacion', async () => {
      // Arrange
      const query = {
        limit: 10,
        skip: 5,
        role: ValidRoles.USER,
        isActive: true,
        verificationStatus: VerificationStatus.PENDING,
        search: 'ana_%',
      };

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(':role = ANY(user.role)', {
        role: ValidRoles.USER,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'user.verificationStatus = :verificationStatus',
        { verificationStatus: VerificationStatus.PENDING },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :term OR user.fullName ILIKE :term)',
        { term: '%ana\\_\\%%' },
      );
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toMatchObject({ total: 1, limit: 10, skip: 5 });
    });

    it('findOneAdmin, adminUpdate, changeRoles y setActiveStatus usan get/preload y protecciones', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());

      // Act
      const adminProfile = await service.findOneAdmin('user-1');
      const updated = await service.adminUpdate('user-1', {
        info: 'Admin edit',
      });
      const roles = await service.changeRoles(
        makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] }),
        'user-1',
        { roles: [ValidRoles.MODERATOR] },
      );
      const inactive = await service.setActiveStatus(
        makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] }),
        'user-1',
        { isActive: false },
      );

      // Assert
      expect(adminProfile.id).toBe('user-1');
      expect(updated.info).toBe('Admin edit');
      expect(roles.role).toEqual([ValidRoles.MODERATOR]);
      expect(inactive.isActive).toBe(false);
    });

    it('adminUpdate devuelve 404 si preload no encuentra el usuario', async () => {
      // Arrange
      userRepository.preload.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.adminUpdate('x', { fullName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('impide quitarse admin o desactivarse a si mismo', async () => {
      // Arrange
      const admin = makeUser({ role: [ValidRoles.ADMIN] });

      // Act / Assert
      await expect(
        service.changeRoles(admin, admin.id, { roles: [ValidRoles.USER] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.setActiveStatus(admin, admin.id, { isActive: false }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('remove hace soft delete mediante setActiveStatus', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());

      // Act
      const result = await service.remove(
        makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] }),
        'user-1',
      );

      // Assert
      expect(result.isActive).toBe(false);
    });
  });

  describe('verification', () => {
    it('requestVerification pasa a PENDING y rechaza estados bloqueados', async () => {
      // Arrange
      const user = makeUser();

      // Act
      const result = await service.requestVerification(user);

      // Assert
      expect(userRepository.preload).toHaveBeenCalledWith({
        id: 'user-1',
        verificationStatus: VerificationStatus.PENDING,
      });
      expect(result.verificationStatus).toBe(VerificationStatus.PENDING);

      await expect(
        service.requestVerification(
          makeUser({ verificationStatus: VerificationStatus.PENDING }),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        service.requestVerification(
          makeUser({ verificationStatus: VerificationStatus.VERIFIED }),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('findPendingVerifications delega en findAll con orden antiguo primero', async () => {
      // Act
      await service.findPendingVerifications({ limit: 20, skip: 0 });

      // Assert
      expect(qb.orderBy).toHaveBeenCalledWith('user.updatedAt', 'ASC');
    });

    it('resolveVerification aprueba o rechaza solo solicitudes pendientes', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(
        makeUser({
          id: 'target-1',
          verificationStatus: VerificationStatus.PENDING,
        }),
      );

      // Act
      const approved = await service.resolveVerification(
        makeUser({ id: 'moderator-1' }),
        'target-1',
        { approved: true },
      );

      // Assert
      expect(approved.verificationStatus).toBe(VerificationStatus.VERIFIED);

      userRepository.findOneBy.mockResolvedValue(
        makeUser({
          id: 'target-1',
          verificationStatus: VerificationStatus.UNVERIFIED,
        }),
      );
      await expect(
        service.resolveVerification(
          makeUser({ id: 'moderator-1' }),
          'target-1',
          {
            approved: false,
            reason: 'faltan datos',
          },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('resolveVerification impide revisar la propia solicitud', async () => {
      // Act / Assert
      await expect(
        service.resolveVerification(makeUser(), 'user-1', { approved: true }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('errors', () => {
    it('convierte errores no esperados en InternalServerErrorException', async () => {
      // Arrange
      userRepository.save.mockRejectedValue(new Error('db down'));

      // Act
      const result = service.create({
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      });

      // Assert
      await expect(result).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});

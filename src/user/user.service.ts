import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ChangeRole } from './dto/changeRole.dto';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { AdminUpdateUserDto } from './dto/adminUpdate.dto';
import { AdminUserQueryDto } from './dto/adminQuery.dto';
import { LoginUserDto } from './dto/login.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UserProfileDto } from './dto/profile.dto';
import { RegisterUserDto } from './dto/register.dto';
import { SearchUserDto } from './dto/search.dto';
import { SetActiveStatus } from './dto/activeStatus.dto';
import { UpdateUserDto } from './dto/update.dto';
import { ResolveVerification } from './dto/verification.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { VerificationStatus } from './enums/verification-status';
import { JwtPayload } from './interfaces/jwt.interface';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
}

type UserSort = {
  by: 'createdAt' | 'updatedAt';
  direction: 'ASC' | 'DESC';
};

const BCRYPT_ROUNDS = 10;

/** Mientras la verificación esté en alguno de estos estados, el nombre no se puede cambiar. */
const NAME_LOCKED_STATUSES: VerificationStatus[] = [
  VerificationStatus.VERIFIED,
  VerificationStatus.PENDING,
];

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  async create(registerDto: RegisterUserDto) {
    const { password, ...userDetails } = registerDto;

    try {
      const user = this.userRepository.create({
        ...userDetails,
        password: await this.encryptPassword(password),
      });

      await this.userRepository.save(user);
      const { password: _password, tokenVersion: _tokenVersion, ...safeUser } = user;

      return {
        ...safeUser,
        token: this.getJwtToken({
          id: user.id,
          email: user.email,
          tokenVersion: user.tokenVersion,
        }),
      };
    } catch (error) {
      this.handleException(error);
    }
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true, isActive: true, tokenVersion: true },
    });

    const passwordMatches = user?.password
      ? await bcrypt.compare(password, user.password)
      : false;

    // Un único mensaje para email inexistente, contraseña errónea o cuenta
    // desactivada: no revela cuál de los tres falló.
    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    return {
      id: user.id,
      email: user.email,
      token: this.getJwtToken({
        id: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion
      }),
    };
  }

  async logout(user: User): Promise<{ message: string }> {

    await this.userRepository.increment({ id: user.id }, 'tokenVersion', 1);
    return { message: 'Session successfuly closed' };

  }

  // ---------------------------------------------------------------------------
  // Usuario autenticado (/user/me)
  // ---------------------------------------------------------------------------

  findMe(user: User): UserProfileDto {
    return this.toProfile(user);
  }

  async updateMe(
    user: User,
    updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    const changesName =
      updateUserDto.fullName !== undefined &&
      updateUserDto.fullName !== user.fullName;

    if (changesName && NAME_LOCKED_STATUSES.includes(user.verificationStatus)) {
      throw new ForbiddenException(
        'The name cannot be changed while the identity is verified or under review',
      );
    }

    const userToUpdate = await this.preloadUser(user.id, updateUserDto);

    if (!userToUpdate) {
      throw new NotFoundException(`User with id ${user.id} not found`);
    }

    try {
      await this.userRepository.save(userToUpdate);
      return this.toProfile(userToUpdate);
    } catch (error) {
      this.handleException(error);
    }
  }

  async changePassword(
    user: User,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = dto;

    await this.assertCurrentPassword(user.id, currentPassword);

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'The new password must be different from the current one',
      );
    }

    try {
      await this.userRepository.update(user.id, {
        password: await this.encryptPassword(newPassword),
      });
    } catch (error) {
      this.handleException(error);
    }

    return { message: 'Password updated successfully' };
  }

  async changeEmail(user: User, dto: ChangeEmailDto): Promise<UserProfileDto> {
    const newEmail = dto.newEmail.toLowerCase().trim();

    await this.assertCurrentPassword(user.id, dto.currentPassword);

    if (newEmail === user.email) {
      throw new BadRequestException(
        'The new email must be different from the current one',
      );
    }

    try {
      // update() no dispara @BeforeUpdate, por eso el email ya va normalizado.
      await this.userRepository.update(user.id, { email: newEmail });
    } catch (error) {
      this.handleException(error, 'Email is already in use');
    }

    return this.toProfile(await this.getUserOrFail(user.id));
  }

  async requestVerification(user: User): Promise<UserProfileDto> {
    if (
      user.verificationStatus === VerificationStatus.VERIFIED ||
      user.verificationStatus === VerificationStatus.PENDING
    ) {
      throw new ConflictException('The identity is already verified or under review');
    }

    const userToUpdate = await this.preloadUser(user.id, {
      verificationStatus: VerificationStatus.PENDING,
    });

    if (!userToUpdate) {
      throw new NotFoundException(`User with id ${user.id} not found`);
    }

    try {
      await this.userRepository.save(userToUpdate);
      return this.toProfile(userToUpdate);
    } catch (error) {
      this.handleException(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Consultas de perfil
  // ---------------------------------------------------------------------------

  async findPublicProfile(id: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOneBy({ id, isActive: true });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.toProfile(user);
  }

  async findProfile(
    searchDto: SearchUserDto,
  ): Promise<UserProfileDto | undefined> {
    try {
      if (typeof searchDto.email === 'string') {
        const user = await this.userRepository.findOneBy({
          email: searchDto.email.toLowerCase().trim(),
        });

        if (user) {
          return this.toProfile(user);
        }
      }

      if (typeof searchDto.fullName === 'string') {
        const user = await this.userRepository.findOneBy({
          fullName: searchDto.fullName,
        });

        if (user) {
          return this.toProfile(user);
        }
      }

      return undefined;
    } catch (error) {
      this.handleException(error);
    }
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      select: { email: true, password: true, id: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Administración (/admin/users)
  // ---------------------------------------------------------------------------

  async findAll(
    query: AdminUserQueryDto,
    sort: UserSort = { by: 'createdAt', direction: 'DESC' },
  ): Promise<PaginatedResult<UserProfileDto>> {
    const { limit, skip, role, isActive, verificationStatus, search } = query;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.info',
        'user.role',
        'user.verificationStatus',
        'user.isActive',
        'user.ratingAverage',
        'user.reviewsCount',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (role) {
      qb.andWhere(':role = ANY(user.role)', { role });
    }

    if (isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }

    if (verificationStatus) {
      qb.andWhere('user.verificationStatus = :verificationStatus', {
        verificationStatus,
      });
    }

    if (search) {
      // Escapa los comodines de LIKE para que se busquen como texto literal.
      const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere('(user.email ILIKE :term OR user.fullName ILIKE :term)', {
        term,
      });
    }

    const [users, total] = await qb
      .orderBy(`user.${sort.by}`, sort.direction)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map((user) => this.toProfile(user)),
      total,
      limit,
      skip,
    };
  }

  async findOneAdmin(id: string): Promise<UserProfileDto> {
    return this.toProfile(await this.getUserOrFail(id));
  }

  async adminUpdate(
    id: string,
    dto: AdminUpdateUserDto,
  ): Promise<UserProfileDto> {
    const userToUpdate = await this.preloadUser(id, dto);

    if (!userToUpdate) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    try {
      await this.userRepository.save(userToUpdate);
      return this.toProfile(userToUpdate);
    } catch (error) {
      this.handleException(error, 'Email is already in use');
    }
  }

  async changeRoles(
    admin: User,
    id: string,
    dto: ChangeRole,
  ): Promise<UserProfileDto> {
    if (admin.id === id && !dto.roles.includes(ValidRoles.ADMIN)) {
      throw new ForbiddenException('You cannot remove your own admin role');
    }

    const user = await this.getUserOrFail(id);
    user.role = dto.roles;

    try {
      await this.userRepository.save(user);
      return this.toProfile(user);
    } catch (error) {
      this.handleException(error);
    }
  }

  async setActiveStatus(
    admin: User,
    id: string,
    dto: SetActiveStatus,
  ): Promise<UserProfileDto> {
    if (admin.id === id && !dto.isActive) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const user = await this.getUserOrFail(id);
    user.isActive = dto.isActive;

    try {
      await this.userRepository.save(user);
      return this.toProfile(user);
    } catch (error) {
      this.handleException(error);
    }
  }

  /** Soft delete: el usuario queda inactivo, sus transacciones se conservan. */
  remove(admin: User, id: string): Promise<UserProfileDto> {
    return this.setActiveStatus(admin, id, { isActive: false });
  }

  // ---------------------------------------------------------------------------
  // Moderación (/moderation/verifications)
  // ---------------------------------------------------------------------------

  findPendingVerifications(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<UserProfileDto>> {
    return this.findAll(
      {
        limit: pagination.limit,
        skip: pagination.skip,
        verificationStatus: VerificationStatus.PENDING,
      },
      // Las solicitudes más antiguas primero.
      { by: 'updatedAt', direction: 'ASC' },
    );
  }

  async resolveVerification(
    moderator: User,
    userId: string,
    dto: ResolveVerification,
  ): Promise<UserProfileDto> {
    if (moderator.id === userId) {
      throw new ForbiddenException(
        'You cannot review your own verification request',
      );
    }

    const user = await this.getUserOrFail(userId);

    if (user.verificationStatus !== VerificationStatus.PENDING) {
      throw new ConflictException('The user has no pending verification');
    }

    user.verificationStatus = dto.approved
      ? VerificationStatus.VERIFIED
      : VerificationStatus.REJECTED;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      this.handleException(error);
    }

    // No hay columna para guardar el motivo: queda solo en el log.
    this.logger.log(
      `Verification of user ${userId} ${user.verificationStatus} by ${moderator.id}` +
      (dto.reason ? ` - reason: ${dto.reason}` : ''),
    );

    return this.toProfile(user);
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private async encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /** Lanza 403 si la contraseña actual no coincide. Lee el hash (select: false). */
  private async assertCurrentPassword(
    userId: string,
    plainPassword: string,
  ): Promise<void> {
    const record = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, password: true },
    });

    const matches = record?.password
      ? await bcrypt.compare(plainPassword, record.password)
      : false;

    if (!matches) {
      throw new ForbiddenException('Current password is incorrect');
    }
  }

  private getJwtToken(jwtPayload: JwtPayload) {
    return this.jwtService.sign(jwtPayload);
  }

  private async getUserOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private async preloadUser(
    userId: string,
    updateDto?: Partial<User>,
  ): Promise<User | undefined> {
    return this.userRepository.preload({
      id: userId,
      ...updateDto,
    });
  }

  private toProfile(user: User): UserProfileDto {
    return UserProfileDto.fromEntity(user);
  }

  private handleException(
    error: unknown,
    conflictMessage = 'User is already registered. Try to login',
  ): never {
    if (error instanceof HttpException) {
      throw error;
    }

    this.logger.error(error);

    if (this.isDatabaseError(error) && error.code === '23505') {
      throw new ConflictException(conflictMessage);
    }

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  private isDatabaseError(error: unknown): error is {
    code?: string;
    detail?: string;
  } {
    return typeof error === 'object' && error !== null;
  }
}

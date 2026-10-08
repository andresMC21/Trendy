import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtPayload } from './interfaces/jwt.interface';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { SearchUserDto } from './dto/search.dto';
import { UpdateUserDto } from './dto/update.dto';
import { UserProfileDto } from './dto/profile.dto';
import { User } from './entities/user.entity';
import { VerificationStatus } from './enums/verification-status';

type VerificationDocument = {
  filename?: string;
  originalname?: string;
  path?: string;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async create(registerDto: RegisterUserDto) {
    const { password, ...userDetails } = registerDto;

    try {
      const user = this.userRepository.create({
        ...userDetails,
        password: this.encryptPassword(password),
      });

      await this.userRepository.save(user);
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({
          id: user.id,
          email: user.email,
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
      select: { email: true, password: true, id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    if (!bcrypt.compareSync(password, user.password!)) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    delete user.password;

    return {
      ...user,
      token: this.getJwtToken({
        id: user.id,
        email: user.email,
      }),
    };
  }

  findMe(user: User): UserProfileDto {
    return this.toProfile(user);
  }

  async updateMe(
    user: User,
    updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
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

  async requestVerification(
    user: User,
    document?: VerificationDocument,
  ): Promise<UserProfileDto> {
    const identityDocumentUrl =
      document?.path ?? document?.filename ?? document?.originalname;

    const userToUpdate = await this.preloadUser(user.id, {
      identityDocumentUrl,
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

  async findPublicProfile(id: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOneBy({ id });

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
          email: searchDto.email,
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
      where: { email },
      select: { email: true, password: true, id: true },
    });
  }

  private encryptPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }

  private getJwtToken(jwtPayload: JwtPayload) {
    return this.jwtService.sign(jwtPayload);
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

  private handleException(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    this.logger.error(error);

    if (this.isDatabaseError(error) && error.code === '23505') {
      throw new ConflictException(error.detail);
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

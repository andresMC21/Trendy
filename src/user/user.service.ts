import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateDateColumn } from 'typeorm';
import { User } from './entities/user.entity';
import bcrypt from "bcrypt";
import { LoginUserDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { UserProfileDto } from './dto/profile.dto';
import { UpdateUserDto } from './dto/update.dto';
import { SearchUserDto } from './dto/search.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Review } from '../review/entities/review.entity';
import { ResolveVerification } from './dto/verification.dto';
import { SetActiveStatus } from './dto/activeStatus.dto';
import { ChangeRole } from './dto/changeRole.dto';

@Injectable()
export class UserService {

  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService
  ) { }


  // Auth methods
  async create(registerDto: RegisterUserDto) {
    const { password, ...userDetails } = registerDto;
    try {
      const user = this.userRepository.create({
        ...userDetails,
        password: this.encryptPassword(password)
      })
      await this.userRepository.save(user);
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({
          id: user.id,
          email: user.email
        })
      };
    } catch (error) {
      this.handleException(error);
    }
  }

  async login(loginDto: LoginUserDto) {

    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    })

    if (!user) throw new UnauthorizedException(`Email or password incorrect`);

    if (!bcrypt.compareSync(password, user.password!)) throw new UnauthorizedException(`Email or password incorrect`);

    delete user.password;
    return {
      ...user,
      token: this.getJwtToken({
        id: user.id,
        email: user.email
      })
    };
  }

  encryptPassword(password: string) {

    return bcrypt.hashSync(password, 10);

  }

  private getJwtToken(jwtPayload: JwtPayload) {

    const token = this.jwtService.sign(jwtPayload);
    return token;

  }

  private handleException(error: any): never {

    if (error instanceof HttpException) throw error;

    this.logger.error(error);

    if (error.code === '23505') throw new ConflictException(error.detail);

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  // Profile

  findMe(user: User): UserProfileDto {

    return this.toProfile(user)

  }

  async updateMe(user: User, updateUserDto: UpdateUserDto): Promise<UserProfileDto> {

    const userToUpdate = await this.preloadUser(user.id, updateUserDto);

    if (!userToUpdate) throw new NotFoundException(`User with id ${user.id} not found`);

    try {
      await this.userRepository.save(userToUpdate);
      return this.toProfile(userToUpdate);
    } catch (error) {
      this.handleException(error);
    }
  }

  private async preloadUser(userId: string, updateDto?: UpdateUserDto): Promise<User | undefined> {

    return await this.userRepository.preload({
      id: userId,
      ...updateDto,
    });
  }

  async findProfile(searchDto: SearchUserDto): Promise<UserProfileDto | undefined> {

    try {

      if (typeof searchDto.email === 'string') {

        const finded = await this.userRepository.findOneBy({ email: searchDto.email })

        if (finded !== null) return UserProfileDto.fromEntity(finded);
      }

      if (typeof searchDto.fullName === 'string') {

        const finded = await this.userRepository.findOneBy({ fullName: searchDto.fullName })

        if (finded !== null) return UserProfileDto.fromEntity(finded);
      }

    } catch (error) {

      this.handleException(error);

    }

  }

  /*
  findReviews(id: string, paginationDto: PaginationDto): Promise<Review[]> {
    
    try {
      


    } catch (error) {
      
    }

  }
    */

  /*
  createReview(reviwer: User, targetId: string, dto: CreateReviewDto): Promise<Review> {

  }
  */

  /*
  async updateRatingAverage(userId: string): Promise<void> {

  }
  */

  async findByEmail(email: string) {

    return await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    })
  }

  private toProfile(user: User): UserProfileDto {

    return UserProfileDto.fromEntity(user);

  }

  /*
  async listPendingVerifications(paginationDto: PaginationDto): Promise<UserProfileDto[]>{

  }
  */

  /*
  async resolveVerification(userId: string, dto: ResolveVerification, reviewer: User): Promise<UserProfileDto> {


  }
  */

  /*
  async setActiveStatus(userId: string, dto: SetActiveStatus, actor: User): Promise<void>{

  }
  */

  /*
  async changeRole(userId: string, dto: ChangeRole, actor: User): Promise<UserProfileDto>{

  }
  */

}

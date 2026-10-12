import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { User } from '../entities/user.entity';

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ format: 'email' })
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  fullName: string;

  @ApiProperty({ nullable: true, type: String })
  @Expose()
  photoUrl: string | null;

  @ApiProperty({ nullable: true, type: String })
  @Expose()
  info: string | null;

  @ApiProperty({ enum: ValidRoles, isArray: true })
  @Expose()
  role: ValidRoles[];

  @ApiProperty({ enum: VerificationStatus })
  @Expose()
  verificationStatus: VerificationStatus;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: 4.8 })
  @Expose()
  ratingAverage: number;

  @ApiProperty({ example: 12 })
  @Expose()
  reviewsCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  updatedAt: Date;

  static fromEntity(user: User): UserProfileDto {
    return plainToInstance(UserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }
}

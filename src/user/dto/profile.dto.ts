import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { User } from '../entities/user.entity';

export class UserProfileDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del usuario.',
  })
  @Expose()
  id: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'vendedor.postman@trendy.test',
    description: 'Correo electrónico normalizado del usuario.',
  })
  @Expose()
  email: string;

  @ApiProperty({
    type: String,
    example: 'Vendedor Postman',
    description: 'Nombre completo del usuario.',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Información adicional del perfil o null si no está definida.',
  })
  @Expose()
  info: string | null;

  @ApiProperty({
    type: String,
    enum: ValidRoles,
    isArray: true,
    example: [ValidRoles.USER],
    description: 'Roles asignados al usuario.',
  })
  @Expose()
  role: ValidRoles[];

  @ApiProperty({
    type: String,
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
    description: 'Estado actual de la verificación de identidad.',
  })
  @Expose()
  verificationStatus: VerificationStatus;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si la cuenta está activa.',
  })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({
    type: Number,
    description: 'Promedio de calificaciones recibidas por el usuario.',
  })
  @Expose()
  ratingAverage?: number;

  @ApiProperty({
    type: Number,
    description: 'Cantidad de reseñas recibidas por el usuario.',
  })
  @Expose()
  reviewsCount: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de creación del usuario.',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de la última actualización del usuario.',
  })
  @Expose()
  updatedAt: Date;

  static fromEntity(user: User): UserProfileDto {
    return plainToInstance(UserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }
}

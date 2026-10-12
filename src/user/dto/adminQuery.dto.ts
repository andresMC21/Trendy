import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { PaginationDto } from './pagination.dto';

export class AdminUserQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    type: String,
    enum: ValidRoles,
    example: ValidRoles.ADMIN,
    description: 'Filtra por uno de los roles del usuario',
  })
  @IsOptional()
  @IsEnum(ValidRoles)
  role?: ValidRoles;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Filtra por estado; acepta true para activos o false para inactivos.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
    description: 'Filtra por estado de verificación.',
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  /** Búsqueda parcial por email o nombre. */
  @ApiPropertyOptional({
    type: String,
    maxLength: 100,
    description:
      'Coincidencia parcial por correo o nombre, de hasta 100 caracteres.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;
}

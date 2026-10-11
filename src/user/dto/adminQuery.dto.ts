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
  @IsOptional()
  @IsEnum(ValidRoles)
  role?: ValidRoles;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  /** Búsqueda parcial por email o nombre. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;
}

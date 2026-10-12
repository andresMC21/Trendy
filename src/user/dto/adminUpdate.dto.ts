import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional } from 'class-validator';
import { UpdateUserDto } from './update.dto';

/**
 * Edición de un usuario por un admin: los campos de perfil (fullName,
 * photoUrl, info) más el email. Rol, estado activo y verificación tienen
 * endpoints propios; password, ratingAverage y reviewsCount nunca se editan.
 */
export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiPropertyOptional({ format: 'email', example: 'nuevo@example.com' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email?: string;
}

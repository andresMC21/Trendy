import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional } from 'class-validator';
import { UpdateUserDto } from './update.dto';

/**
 * Edición de un usuario por un admin: los campos de perfil (fullName, info)
 * más el email. Rol, estado activo y verificación tienen
 * endpoints propios; password, ratingAverage y reviewsCount nunca se editan.
 */
export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiPropertyOptional({
    type: String,
    format: 'email',
    example: 'temp.new.123@trendy.test',
    description: 'Nuevo correo electrónico del usuario.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email?: string;
}

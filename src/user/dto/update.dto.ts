import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RegisterUserDto } from './register.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['fullName'] as const),
) {
  @ApiPropertyOptional({
    type: String,
    maxLength: 300,
    description: 'Información adicional del perfil, de hasta 300 caracteres.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  info?: string;
}

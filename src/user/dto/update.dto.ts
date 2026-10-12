import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { RegisterUserDto } from './register.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['fullName'] as const),
) {
  @ApiPropertyOptional({
    type: String,
    format: 'uri',
    example: 'https://example.com/vendedor.png',
    description: 'URL de la foto de perfil.',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

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

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    type: String,
    example: 'Passw0rd1',
    writeOnly: true,
    description: 'Contraseña actual de la cuenta.',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  // Mismas reglas que RegisterUserDto.
  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 12,
    example: 'Passw0rd2',
    writeOnly: true,
    description: 'Nueva contraseña distinta a la actual, de 8 a 12 caracteres.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  newPassword: string;
}

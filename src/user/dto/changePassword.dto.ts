import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  // Mismas reglas que RegisterUserDto.
  @ApiProperty({ minLength: 8, maxLength: 12, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  newPassword: string;
}

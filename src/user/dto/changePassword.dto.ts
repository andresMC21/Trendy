import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  // Mismas reglas que RegisterUserDto.
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  newPassword: string;
}

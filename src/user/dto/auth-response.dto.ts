import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './profile.dto';

export class LoginResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ description: 'JWT para autenticar solicitudes protegidas' })
  token: string;
}

export class RegisterResponseDto extends UserProfileDto {
  @ApiProperty({ description: 'JWT para autenticar solicitudes protegidas' })
  token: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Password updated successfully' })
  message: string;
}

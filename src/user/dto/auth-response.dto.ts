import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './profile.dto';

export class LoginResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del usuario autenticado.',
  })
  id: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'vendedor.postman@trendy.test',
    description: 'Correo electrónico de la cuenta autenticada.',
  })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Token JWT para autenticar solicitudes protegidas.',
  })
  token: string;
}

export class RegisterResponseDto extends UserProfileDto {
  @ApiProperty({
    type: String,
    description: 'Token JWT para autenticar solicitudes protegidas.',
  })
  token: string;
}

export class MessageResponseDto {
  @ApiProperty({
    type: String,
    description: 'Mensaje que confirma la operación realizada.',
  })
  message: string;
}

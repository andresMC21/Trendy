import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({
    type: String,
    example: 'Passw0rd1',
    writeOnly: true,
    description: 'Contraseña actual de la cuenta.',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'temp.new.123@trendy.test',
    description:
      'Nuevo correo; se normaliza a minúsculas y sin espacios externos.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  newEmail: string;
}

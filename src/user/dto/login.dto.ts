import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    type: String,
    format: 'email',
    example: 'vendedor.postman@trendy.test',
    description: 'Correo electrónico registrado; se normaliza a minúsculas.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    example: 'Passw0rd1',
    writeOnly: true,
    description: 'Contraseña asociada a la cuenta.',
  })
  @IsString()
  password: string;
}

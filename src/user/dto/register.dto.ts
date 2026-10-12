import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    type: String,
    format: 'email',
    example: 'vendedor.postman@trendy.test',
    description: 'Correo electrónico de la cuenta; se normaliza a minúsculas.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 12,
    example: 'Passw0rd1',
    writeOnly: true,
    description: 'Contraseña de 8 a 12 caracteres.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  password: string;

  @ApiProperty({
    type: String,
    example: 'Vendedor Postman',
    description: 'Nombre completo de la persona registrada.',
  })
  @IsString()
  fullName: string;
}

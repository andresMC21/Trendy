import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ format: 'email', example: 'ana@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 12, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  password: string;

  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  fullName: string;
}

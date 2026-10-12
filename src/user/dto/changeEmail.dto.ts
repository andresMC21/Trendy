import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ format: 'email', example: 'nuevo@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  newEmail: string;
}

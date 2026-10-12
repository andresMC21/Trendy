import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { RegisterUserDto } from './register.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['fullName'] as const),
) {
  @ApiPropertyOptional({
    format: 'uri',
    example: 'https://example.com/photo.jpg',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({
    maxLength: 300,
    example: 'Amante de los libros y la música.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  info?: string;
}

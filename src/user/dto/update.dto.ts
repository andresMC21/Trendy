import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { RegisterUserDto } from './register.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['fullName'] as const),
) {
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

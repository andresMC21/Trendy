import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { ValidRoles } from '../enums/valid-roles.enum';

export class ChangeRole {
  @ApiProperty({ enum: ValidRoles, isArray: true, example: [ValidRoles.USER] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(ValidRoles, { each: true })
  roles: ValidRoles[];
}

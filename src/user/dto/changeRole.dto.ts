import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { ValidRoles } from '../enums/valid-roles.enum';

export class ChangeRole {
  @ApiProperty({
    type: String,
    enum: ValidRoles,
    isArray: true,
    example: [ValidRoles.USER, ValidRoles.MODERATOR],
    description:
      'Lista no vacía y sin duplicados de roles que reemplazan los actuales.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(ValidRoles, { each: true })
  roles: ValidRoles[];
}

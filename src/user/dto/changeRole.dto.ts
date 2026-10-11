import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { ValidRoles } from '../enums/valid-roles.enum';

export class ChangeRole {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsEnum(ValidRoles, { each: true })
    roles: ValidRoles[];
}

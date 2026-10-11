import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator"

export class RegisterUserDto {

    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toLowerCase().trim() : value,
    )
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(12)
    password: string;

    @IsString()
    fullName: string;
}
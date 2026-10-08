import { IsEmail, IsString, MaxLength, MinLength } from "class-validator"

export class RegisterUserDto {

    @IsString()
    @MinLength(8)
    @MaxLength(10)
    id: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(12)
    password: string;

    @IsString()
    fullName: string;
}
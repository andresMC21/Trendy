import { IsEmail, IsString, MaxLength, MinLength } from "class-validator"

export class LoginUserDto {

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(12)
    password: string;

}
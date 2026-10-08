import { IsEmail, IsString } from "class-validator";

export class SearchUserDto {

    @IsEmail()
    email?: string;

    @IsString()
    fullName?: string;
}
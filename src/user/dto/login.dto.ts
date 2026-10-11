import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {

    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toLowerCase().trim() : value,
    )
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}
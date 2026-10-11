import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class SearchUserDto {
    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toLowerCase().trim() : value,
    )
    @IsEmail()
    email?: string;

    @IsString()
    fullName?: string;
}
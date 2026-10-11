   import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
   export class ResolveVerification {
     @IsBoolean() approved: boolean;
     @IsOptional() @IsString() @MaxLength(300) reason?: string;
   }
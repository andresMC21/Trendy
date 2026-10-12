import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveVerification {
  @ApiProperty({ description: 'true aprueba y false rechaza la solicitud' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    maxLength: 300,
    description: 'Motivo registrado en los logs; no se almacena en el perfil',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

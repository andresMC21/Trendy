import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveVerification {
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'true aprueba la solicitud; false la rechaza.',
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'Documento ilegible',
    maxLength: 300,
    description:
      'Motivo de hasta 300 caracteres; se registra en logs, no en el perfil.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

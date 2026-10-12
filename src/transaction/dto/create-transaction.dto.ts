import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '{{productId}}',
    description:
      'Identificador UUID del producto sobre el que se inicia la compra o trueque.',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Me interesa, ¿sigue disponible?',
    maxLength: 500,
    description:
      'Mensaje opcional que el comprador envía al vendedor (máximo 500 caracteres).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

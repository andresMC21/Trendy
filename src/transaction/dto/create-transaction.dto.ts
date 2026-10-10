import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Id del producto sobre el que se inicia la compra o trueque.',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'Me interesa comprarlo hoy en la tarde.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Id de la transaccion completada que se va a reseñar.',
  })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Entrega puntual y producto en buen estado.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

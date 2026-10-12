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
    type: String,
    format: 'uuid',
    example: '{{transactionId}}',
    description:
      'Identificador UUID de la transacción completada que se va a reseñar.',
  })
  @IsUUID()
  transactionId: string;

  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'Calificación entera entre 1 y 5.',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Entrega puntual y producto en buen estado.',
    maxLength: 1000,
    nullable: true,
    description:
      'Comentario opcional; en una actualización, null permite borrar el comentario existente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}

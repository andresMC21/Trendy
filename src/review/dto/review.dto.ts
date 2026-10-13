import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../entities/review.entity';

export class ReviewUserDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del usuario.',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Comprador Postman',
    description: 'Nombre completo del usuario.',
  })
  fullName: string;
}

export class ReviewDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único de la reseña.',
  })
  id: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '{{transactionId}}',
    description: 'Identificador de la transacción reseñada.',
  })
  transactionId: string;

  @ApiProperty({
    type: ReviewUserDto,
    description: 'Usuario que escribió la reseña.',
  })
  reviewer: ReviewUserDto;

  @ApiProperty({
    type: ReviewUserDto,
    description: 'Usuario que recibió la reseña.',
  })
  targetUser: ReviewUserDto;

  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'Calificación entera entre 1 y 5.',
  })
  rating: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Entrega puntual y producto en buen estado.',
    description: 'Comentario de la reseña o null si no se proporcionó.',
  })
  comment: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de creación de la reseña.',
  })
  createdAt: Date;

  static fromEntity(review: Review): ReviewDto {
    const dto = new ReviewDto();
    dto.id = review.id;
    dto.transactionId = review.transactionId;
    dto.reviewer = {
      id: review.reviewer.id,
      fullName: review.reviewer.fullName,
    };
    dto.targetUser = {
      id: review.targetUser.id,
      fullName: review.targetUser.fullName,
    };
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.createdAt = review.createdAt;
    return dto;
  }
}

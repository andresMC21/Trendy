import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../entities/review.entity';

export class ReviewUserDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() fullName: string;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;
}

export class ReviewDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) transactionId: string;
  @ApiProperty({ type: ReviewUserDto }) reviewer: ReviewUserDto;
  @ApiProperty({ type: ReviewUserDto }) targetUser: ReviewUserDto;
  @ApiProperty({ minimum: 1, maximum: 5 }) rating: number;
  @ApiProperty({ nullable: true, type: String }) comment: string | null;
  @ApiProperty() createdAt: Date;

  static fromEntity(review: Review): ReviewDto {
    const dto = new ReviewDto();
    dto.id = review.id;
    dto.transactionId = review.transactionId;
    dto.reviewer = {
      id: review.reviewer.id,
      fullName: review.reviewer.fullName,
      photoUrl: review.reviewer.photoUrl,
    };
    dto.targetUser = {
      id: review.targetUser.id,
      fullName: review.targetUser.fullName,
      photoUrl: review.targetUser.photoUrl,
    };
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.createdAt = review.createdAt;
    return dto;
  }
}

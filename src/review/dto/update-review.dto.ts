import { PartialType, PickType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(
  PickType(CreateReviewDto, ['rating', 'comment'] as const),
) {}

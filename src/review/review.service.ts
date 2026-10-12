import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    reviewerId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: createReviewDto.transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with id ${createReviewDto.transactionId} not found`,
      );
    }

    this.assertParticipant(transaction, reviewerId);

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new ConflictException(
        'Solo se pueden reseñar transacciones completadas',
      );
    }

    const existing = await this.reviewRepository.findOne({
      where: {
        transactionId: transaction.id,
        reviewerId,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe una reseña de este usuario para esta transaccion',
      );
    }

    const targetUserId =
      transaction.buyerId === reviewerId
        ? transaction.sellerId
        : transaction.buyerId;

    const review = this.reviewRepository.create({
      transactionId: transaction.id,
      reviewerId,
      targetUserId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment ?? null,
    });

    const saved = await this.reviewRepository.save(review);
    await this.refreshUserRating(targetUserId);

    return ReviewDto.fromEntity(await this.findEntity(saved.id));
  }

  async findAll(userId: string): Promise<ReviewDto[]> {
    const reviews = await this.reviewRepository.find({
      where: [{ reviewerId: userId }, { targetUserId: userId }],
      relations: {
        reviewer: true,
        targetUser: true,
      },
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ReviewDto.fromEntity(review));
  }

  async findOne(id: string, userId: string): Promise<ReviewDto> {
    const review = await this.findEntity(id);
    this.assertReviewParticipant(review, userId);
    return ReviewDto.fromEntity(review);
  }

  async update(
    id: string,
    reviewerId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    const review = await this.findEntity(id);

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('Solo el autor puede modificar la reseña');
    }

    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment ?? null;
    }

    await this.reviewRepository.save(review);
    await this.refreshUserRating(review.targetUserId);

    return ReviewDto.fromEntity(await this.findEntity(id));
  }

  async remove(id: string, reviewerId: string): Promise<void> {
    const review = await this.findEntity(id);

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('Solo el autor puede eliminar la reseña');
    }

    await this.reviewRepository.remove(review);
    await this.refreshUserRating(review.targetUserId);
  }

  private async findEntity(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        reviewer: true,
        targetUser: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    return review;
  }

  private assertParticipant(transaction: Transaction, userId: string): void {
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'Solo los participantes pueden reseñar esta transaccion',
      );
    }
  }

  private assertReviewParticipant(review: Review, userId: string): void {
    if (review.reviewerId !== userId && review.targetUserId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta reseña');
    }
  }

  private async refreshUserRating(userId: string): Promise<void> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('review.targetUserId = :userId', { userId })
      .getRawOne<{ average: string | null; count: string }>();

    await this.userRepository.update(userId, {
      ratingAverage: result?.average ? Number(result.average) : 0,
      reviewsCount: result?.count ? Number(result.count) : 0,
    });
  }
}

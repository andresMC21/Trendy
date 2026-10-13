import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';
import { User } from '../user/entities/user.entity';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewService } from './review.service';

const makeUser = (over: Partial<User> = {}) =>
  ({
    id: 'buyer-1',
    fullName: 'Buyer',
    ...over,
  }) as User;

const makeTransaction = (over: Partial<Transaction> = {}) =>
  ({
    id: 'transaction-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: TransactionStatus.COMPLETED,
    ...over,
  }) as Transaction;

const makeReview = (over: Partial<Review> = {}) =>
  ({
    id: 'review-1',
    transactionId: 'transaction-1',
    reviewerId: 'buyer-1',
    reviewer: makeUser({ id: 'buyer-1', fullName: 'Buyer' }),
    targetUserId: 'seller-1',
    targetUser: makeUser({ id: 'seller-1', fullName: 'Seller' }),
    rating: 5,
    comment: 'Excelente',
    createdAt: new Date('2026-10-05T15:00:00Z'),
    ...over,
  }) as Review;

describe('ReviewService', () => {
  let service: ReviewService;
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  const reviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const transactionRepository = {
    findOne: jest.fn(),
  };
  const userRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queryBuilder.getRawOne.mockResolvedValue({ average: '5', count: '1' });
    reviewRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: reviewRepository },
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  it('create guarda una resena para la contraparte y recalcula rating', async () => {
    // Arrange
    const transaction = makeTransaction();
    const created = makeReview();
    transactionRepository.findOne.mockResolvedValue(transaction);
    reviewRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeReview());
    reviewRepository.create.mockReturnValue(created);
    reviewRepository.save.mockResolvedValue(created);

    // Act
    const result = await service.create('buyer-1', {
      transactionId: 'transaction-1',
      rating: 5,
      comment: 'Excelente',
    });

    // Assert
    expect(reviewRepository.create).toHaveBeenCalledWith({
      transactionId: 'transaction-1',
      reviewerId: 'buyer-1',
      targetUserId: 'seller-1',
      rating: 5,
      comment: 'Excelente',
    });
    expect(userRepository.update).toHaveBeenCalledWith('seller-1', {
      ratingAverage: 5,
      reviewsCount: 1,
    });
    expect(result).toMatchObject({
      id: 'review-1',
      transactionId: 'transaction-1',
      rating: 5,
      reviewer: { id: 'buyer-1' },
      targetUser: { id: 'seller-1' },
    });
  });

  it('create rechaza transacciones inexistentes', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValueOnce(null);

    // Act
    const result = service.create('buyer-1', {
      transactionId: 'missing',
      rating: 5,
    });

    // Assert
    await expect(result).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rechaza usuarios que no participan en la transaccion', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValueOnce(makeTransaction());

    // Act
    const result = service.create('other-user', {
      transactionId: 'transaction-1',
      rating: 5,
    });

    // Assert
    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create rechaza transacciones que no estan completadas', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValueOnce(
      makeTransaction({ status: TransactionStatus.PENDING }),
    );

    // Act
    const result = service.create('buyer-1', {
      transactionId: 'transaction-1',
      rating: 5,
    });

    // Assert
    await expect(result).rejects.toBeInstanceOf(ConflictException);
  });

  it('create rechaza resenas duplicadas para el mismo reviewer', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValueOnce(makeTransaction());
    reviewRepository.findOne.mockResolvedValueOnce(makeReview());

    // Act
    const result = service.create('buyer-1', {
      transactionId: 'transaction-1',
      rating: 5,
    });

    // Assert
    await expect(result).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll lista resenas hechas o recibidas por el usuario', async () => {
    // Arrange
    reviewRepository.find.mockResolvedValue([makeReview()]);

    // Act
    const result = await service.findAll('buyer-1');

    // Assert
    expect(reviewRepository.find).toHaveBeenCalledWith({
      where: [{ reviewerId: 'buyer-1' }, { targetUserId: 'buyer-1' }],
      relations: {
        reviewer: true,
        targetUser: true,
      },
      order: { createdAt: 'DESC' },
    });
    expect(result).toHaveLength(1);
  });

  it('findOne solo permite ver resenas propias o recibidas', async () => {
    // Arrange
    reviewRepository.findOne.mockResolvedValue(makeReview());

    // Act
    const result = service.findOne('review-1', 'other-user');

    // Assert
    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update solo permite modificar al autor y recalcula rating', async () => {
    // Arrange
    const updateDto = {
      rating: 4,
      comment: null,
    } as unknown as UpdateReviewDto;
    reviewRepository.findOne
      .mockResolvedValueOnce(makeReview())
      .mockResolvedValueOnce(makeReview({ rating: 4, comment: null }));
    reviewRepository.save.mockImplementation(async (value) => value);

    // Act
    const result = await service.update('review-1', 'buyer-1', updateDto);

    // Assert
    expect(reviewRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4, comment: null }),
    );
    expect(userRepository.update).toHaveBeenCalledWith('seller-1', {
      ratingAverage: 5,
      reviewsCount: 1,
    });
    expect(result.rating).toBe(4);
  });

  it('remove solo permite eliminar al autor y recalcula rating', async () => {
    // Arrange
    const review = makeReview();
    reviewRepository.findOne.mockResolvedValue(review);

    // Act
    await service.remove('review-1', 'buyer-1');

    // Assert
    expect(reviewRepository.remove).toHaveBeenCalledWith(review);
    expect(userRepository.update).toHaveBeenCalledWith('seller-1', {
      ratingAverage: 5,
      reviewsCount: 1,
    });
  });
});

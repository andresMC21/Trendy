import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

describe('ReviewController', () => {
  let controller: ReviewController;
  const reviewService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const user = { id: 'user-1' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: reviewService }],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  it('should be defined', () => {
    // Assert
    expect(controller).toBeDefined();
  });

  it('create delega con el usuario autenticado', () => {
    // Arrange
    const dto: CreateReviewDto = {
      transactionId: 'transaction-1',
      rating: 5,
      comment: 'Excelente',
    };

    // Act
    controller.create(user, dto);

    // Assert
    expect(reviewService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('findAll delega con el usuario autenticado', () => {
    // Act
    controller.findAll(user);

    // Assert
    expect(reviewService.findAll).toHaveBeenCalledWith('user-1');
  });

  it('findOne delega con id y usuario autenticado', () => {
    // Act
    controller.findOne('review-1', user);

    // Assert
    expect(reviewService.findOne).toHaveBeenCalledWith('review-1', 'user-1');
  });

  it('update delega con id, usuario autenticado y dto', () => {
    // Arrange
    const dto: UpdateReviewDto = { rating: 4 };

    // Act
    controller.update('review-1', user, dto);

    // Assert
    expect(reviewService.update).toHaveBeenCalledWith('review-1', 'user-1', dto);
  });

  it('remove delega con id y usuario autenticado', () => {
    // Act
    controller.remove('review-1', user);

    // Assert
    expect(reviewService.remove).toHaveBeenCalledWith('review-1', 'user-1');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  it('create devuelve el placeholder actual', () => {
    // Arrange
    const dto = { rating: 5 } as any;

    // Act
    const result = service.create(dto);

    // Assert
    expect(result).toBe('This action adds a new review');
  });

  it('findAll devuelve el placeholder actual', () => {
    // Act
    const result = service.findAll();

    // Assert
    expect(result).toBe('This action returns all review');
  });

  it('findOne, update y remove incluyen el id solicitado', () => {
    // Arrange
    const dto = { rating: 4 } as any;

    // Act
    const one = service.findOne(3);
    const updated = service.update(3, dto);
    const removed = service.remove(3);

    // Assert
    expect(one).toBe('This action returns a #3 review');
    expect(updated).toBe('This action updates a #3 review');
    expect(removed).toBe('This action removes a #3 review');
  });
});

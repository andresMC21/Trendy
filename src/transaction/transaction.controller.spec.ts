import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatus } from './enums/transaction-status.enum';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

describe('TransactionController', () => {
  let controller: TransactionController;
  const transactionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    confirmPoint: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: TransactionService, useValue: transactionService }],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    // Arrange
    // Act
    // Assert
    expect(controller).toBeDefined();
  });

  it('create usa el id del usuario autenticado', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    const dto = { productId: 'p1' };
    transactionService.create.mockResolvedValue('created');

    // Act
    const result = await controller.create(user, dto);

    // Assert
    expect(result).toBe('created');
    expect(transactionService.create).toHaveBeenCalledWith('buyer-1', dto);
  });

  it('findAll lista transacciones del usuario autenticado', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    transactionService.findAll.mockResolvedValue(['t1']);

    // Act
    const result = await controller.findAll(user);

    // Assert
    expect(result).toEqual(['t1']);
    expect(transactionService.findAll).toHaveBeenCalledWith('buyer-1');
  });

  it('updateStatus delega id, usuario y estado', async () => {
    // Arrange
    const user = { id: 'seller-1' } as any;
    const dto = { status: TransactionStatus.COMPLETED };
    transactionService.update.mockResolvedValue('updated');

    // Act
    const result = await controller.updateStatus('t1', user, dto);

    // Assert
    expect(result).toBe('updated');
    expect(transactionService.update).toHaveBeenCalledWith('t1', 'seller-1', dto);
  });

  it('confirmPoint delega id, usuario y punto seguro', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    const dto = { safePointId: 'sp-1', scheduledTime: '2026-10-05T15:00:00Z' };
    transactionService.confirmPoint.mockResolvedValue('confirmed');

    // Act
    const result = await controller.confirmPoint('t1', user, dto);

    // Assert
    expect(result).toBe('confirmed');
    expect(transactionService.confirmPoint).toHaveBeenCalledWith('t1', 'buyer-1', dto);
  });
});

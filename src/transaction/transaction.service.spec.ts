import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ProductStatus } from '../product/enums/product-status.enum';
import { ProductService } from '../product/product.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';
import { TransactionService } from './transaction.service';

const makeProduct = (over: any = {}) => ({
  id: 'p1',
  sellerId: 'seller-1',
  title: 'Bici',
  description: 'desc',
  price: 100,
  acceptsBarter: false,
  category: 'deportes',
  condition: 'USADO',
  status: ProductStatus.AVAILABLE,
  location: { type: 'Point', coordinates: [-76.5, 3.4] },
  neighborhoodId: 'granada',
  estimatedWeightKg: 10,
  images: [],
  viewsCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const makeTransaction = (over: Partial<Transaction> = {}) =>
  ({
    id: 't1',
    productId: 'p1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: TransactionStatus.PENDING,
    safePointId: null,
    scheduledTime: null,
    product: makeProduct(),
    buyer: { id: 'buyer-1', fullName: 'Buyer', photoUrl: null },
    seller: { id: 'seller-1', fullName: 'Seller', photoUrl: null },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Transaction;

describe('TransactionService', () => {
  let service: TransactionService;
  const transactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const productService = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: getRepositoryToken(Transaction), useValue: transactionRepository },
        { provide: ProductService, useValue: productService },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    // Arrange
    // Act
    // Assert
    expect(service).toBeDefined();
  });

  it('create reserva el producto y guarda la transaccion', async () => {
    // Arrange
    const product = makeProduct();
    const transaction = makeTransaction({ product });
    productService.findById.mockResolvedValue(product);
    transactionRepository.findOne.mockResolvedValue(null);
    transactionRepository.create.mockReturnValue(transaction);
    transactionRepository.save.mockResolvedValue(transaction);

    // Act
    const result = await service.create('buyer-1', { productId: 'p1' });

    // Assert
    expect(productService.updateStatus).toHaveBeenCalledWith('p1', ProductStatus.RESERVED);
    expect(transactionRepository.create).toHaveBeenCalledWith({
      productId: 'p1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      status: TransactionStatus.PENDING,
    });
    expect(result).toMatchObject({
      id: 't1',
      productId: 'p1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      status: TransactionStatus.PENDING,
    });
  });

  it('create rechaza compras del propio vendedor', async () => {
    // Arrange
    productService.findById.mockResolvedValue(makeProduct({ sellerId: 'seller-1' }));

    // Act
    const result = service.create('seller-1', { productId: 'p1' });

    // Assert
    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('create rechaza productos que no estan disponibles', async () => {
    // Arrange
    productService.findById.mockResolvedValue(makeProduct({ status: ProductStatus.RESERVED }));

    // Act
    const result = service.create('buyer-1', { productId: 'p1' });

    // Assert
    await expect(result).rejects.toBeInstanceOf(ConflictException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('findOne solo permite participantes', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValue(makeTransaction());

    // Act
    const result = service.findOne('t1', 'otro');

    // Assert
    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('confirmPoint guarda punto, horario y cambia a AGREED_POINT', async () => {
    // Arrange
    const transaction = makeTransaction();
    transactionRepository.findOne.mockResolvedValue(transaction);
    transactionRepository.save.mockImplementation(async (value) => value);

    // Act
    const result = await service.confirmPoint('t1', 'buyer-1', {
      safePointId: 'sp-1',
      scheduledTime: '2026-10-05T15:00:00Z',
    });

    // Assert
    expect(transactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        safePointId: 'sp-1',
        status: TransactionStatus.AGREED_POINT,
      }),
    );
    expect(result.status).toBe(TransactionStatus.AGREED_POINT);
    expect(result.safePointId).toBe('sp-1');
  });

  it('update a COMPLETED marca el producto como SOLD', async () => {
    // Arrange
    const transaction = makeTransaction({
      status: TransactionStatus.AGREED_POINT,
      safePointId: 'sp-1',
      scheduledTime: new Date('2026-10-05T15:00:00Z'),
    });
    transactionRepository.findOne.mockResolvedValue(transaction);
    transactionRepository.save.mockImplementation(async (value) => value);

    // Act
    const result = await service.update('t1', 'seller-1', {
      status: TransactionStatus.COMPLETED,
    });

    // Assert
    expect(productService.updateStatus).toHaveBeenCalledWith('p1', ProductStatus.SOLD);
    expect(result.status).toBe(TransactionStatus.COMPLETED);
  });

  it('update a CANCELLED libera el producto', async () => {
    // Arrange
    const transaction = makeTransaction();
    transactionRepository.findOne.mockResolvedValue(transaction);
    transactionRepository.save.mockImplementation(async (value) => value);

    // Act
    const result = await service.update('t1', 'buyer-1', {
      status: TransactionStatus.CANCELLED,
    });

    // Assert
    expect(productService.updateStatus).toHaveBeenCalledWith('p1', ProductStatus.AVAILABLE);
    expect(result.status).toBe(TransactionStatus.CANCELLED);
  });
});

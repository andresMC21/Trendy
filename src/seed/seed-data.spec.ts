import {
  seedProducts,
  seedReviews,
  seedTransactions,
  seedUsers,
} from './seed-data';
import { ProductStatus } from '../product/enums/product-status.enum';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';

const unique = (values: readonly string[]) =>
  new Set(values).size === values.length;

describe('seed data', () => {
  it('usa ids y emails unicos para que la semilla sea idempotente', () => {
    // Act
    const ids = [
      ...seedUsers.map((user) => user.id),
      ...seedProducts.map((product) => product.id),
      ...seedTransactions.map((transaction) => transaction.id),
      ...seedReviews.map((review) => review.id),
    ];

    // Assert
    expect(unique(ids)).toBe(true);
    expect(unique(seedUsers.map((user) => user.email))).toBe(true);
  });

  it('solo referencia usuarios, productos y transacciones existentes', () => {
    // Arrange
    const userIds = new Set(seedUsers.map((user) => user.id));
    const productIds = new Set(seedProducts.map((product) => product.id));
    const transactionIds = new Set(
      seedTransactions.map((transaction) => transaction.id),
    );

    // Act / Assert
    expect(seedProducts.every((product) => userIds.has(product.sellerId))).toBe(
      true,
    );
    expect(
      seedTransactions.every(
        (transaction) =>
          userIds.has(transaction.buyerId) &&
          userIds.has(transaction.sellerId) &&
          productIds.has(transaction.productId),
      ),
    ).toBe(true);
    expect(
      seedReviews.every(
        (review) =>
          userIds.has(review.reviewerId) &&
          userIds.has(review.targetUserId) &&
          transactionIds.has(review.transactionId),
      ),
    ).toBe(true);
  });

  it('solo crea resenas para transacciones completadas', () => {
    // Arrange
    const transactionsById = new Map(
      seedTransactions.map((transaction) => [transaction.id, transaction]),
    );

    // Act
    const reviewedTransactions = seedReviews.map((review) =>
      transactionsById.get(review.transactionId),
    );

    // Assert
    expect(
      reviewedTransactions.every(
        (transaction) => transaction?.status === TransactionStatus.COMPLETED,
      ),
    ).toBe(true);
  });

  it('mantiene como vendidos los productos de transacciones completadas', () => {
    // Arrange
    const productsById = new Map(
      seedProducts.map((product) => [product.id, product]),
    );
    const completedTransactions = seedTransactions.filter(
      (transaction) => transaction.status === TransactionStatus.COMPLETED,
    );

    // Act
    const completedProducts = completedTransactions.map((transaction) =>
      productsById.get(transaction.productId),
    );

    // Assert
    expect(
      completedProducts.every(
        (product) => product?.status === ProductStatus.SOLD,
      ),
    ).toBe(true);
  });

  it('incluye datos suficientes para alimentar el feed inicial', () => {
    // Act / Assert
    expect(seedUsers.length).toBeGreaterThanOrEqual(4);
    expect(seedProducts.length).toBeGreaterThanOrEqual(3);
    expect(seedTransactions.length).toBeGreaterThanOrEqual(1);
  });
});

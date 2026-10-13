import { getMetadataArgsStorage } from 'typeorm';
import { TransactionUserDto } from '../dto/transaction-user.dto';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { User } from '../../user/entities/user.entity';
import { ValidRoles } from '../../user/enums/valid-roles.enum';
import { VerificationStatus } from '../../user/enums/verification-status';
import { Transaction } from './transaction.entity';

describe('Transaction entity', () => {
  it('esta registrada como entidad de TypeORM', () => {
    // Arrange
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === Transaction,
    );

    // Act / Assert
    expect(table).toBeDefined();
  });

  it('define columnas principales y estado por defecto PENDING', () => {
    // Arrange
    const columns = getMetadataArgsStorage().columns.filter(
      (column) => column.target === Transaction,
    );
    const columnNames = columns.map((column) => column.propertyName);
    const status = columns.find((column) => column.propertyName === 'status');

    // Act / Assert
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'productId',
        'buyerId',
        'sellerId',
        'status',
        'safePointId',
        'scheduledTime',
        'createdAt',
        'updatedAt',
      ]),
    );
    expect(status?.options.default).toBe(TransactionStatus.PENDING);
  });

  it('define relaciones con producto, comprador y vendedor', () => {
    // Arrange
    const relationNames = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === Transaction)
      .map((relation) => relation.propertyName);

    // Act / Assert
    expect(relationNames).toEqual(
      expect.arrayContaining(['product', 'buyer', 'seller']),
    );
  });

  it('TransactionUserDto no expone datos sensibles del usuario relacionado', () => {
    // Arrange
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      password: 'hash',
      fullName: 'Usuario',
      info: 'bio',
      verificationStatus: VerificationStatus.UNVERIFIED,
      ratingAverage: 0,
      reviewsCount: 0,
      isActive: true,
      role: [ValidRoles.USER],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    // Act
    const result = TransactionUserDto.fromEntity(user);

    // Assert
    expect(result).toEqual({
      id: 'user-1',
      fullName: 'Usuario',
    });
    expect(TransactionUserDto.fromEntity(undefined)).toBeUndefined();
  });
});

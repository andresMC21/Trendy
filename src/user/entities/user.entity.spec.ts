import { getMetadataArgsStorage } from 'typeorm';
import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { User } from './user.entity';

describe('User entity', () => {
  it('esta registrada como entidad de TypeORM', () => {
    // Arrange
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === User,
    );

    // Act / Assert
    expect(table).toBeDefined();
  });

  it('define columnas de autenticacion, perfil y moderacion', () => {
    // Arrange
    const columnNames = getMetadataArgsStorage()
      .columns.filter((column) => column.target === User)
      .map((column) => column.propertyName);

    // Act / Assert
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'password',
        'fullName',
        'tokenVersion',
        'info',
        'verificationStatus',
        'ratingAverage',
        'reviewsCount',
        'isActive',
        'role',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('configura password como select false y email como unico', () => {
    // Arrange
    const columns = getMetadataArgsStorage().columns.filter(
      (column) => column.target === User,
    );
    const email = columns.find((column) => column.propertyName === 'email');
    const password = columns.find(
      (column) => column.propertyName === 'password',
    );

    // Act / Assert
    expect(email?.options.unique).toBe(true);
    expect(password?.options.select).toBe(false);
  });

  it('define defaults seguros para usuario nuevo', () => {
    // Arrange
    const columns = getMetadataArgsStorage().columns.filter(
      (column) => column.target === User,
    );
    const status = columns.find(
      (column) => column.propertyName === 'verificationStatus',
    );
    const active = columns.find((column) => column.propertyName === 'isActive');
    const role = columns.find((column) => column.propertyName === 'role');
    const tokenVersion = columns.find(
      (column) => column.propertyName === 'tokenVersion',
    );

    // Act / Assert
    expect(status?.options.default).toBe(VerificationStatus.UNVERIFIED);
    expect(active?.options.default).toBe(true);
    expect(role?.options.default).toEqual([ValidRoles.USER]);
    expect(tokenVersion?.options.default).toBe(0);
  });

  it('normaliza email antes de insertar o actualizar', () => {
    // Arrange
    const user = Object.assign(new User(), {
      email: ' USER@EXAMPLE.COM ',
    });

    // Act
    user.checkEmailBeforeChanges();

    // Assert
    expect(user.email).toBe('user@example.com');
  });
});

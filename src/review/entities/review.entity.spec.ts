import { getMetadataArgsStorage } from 'typeorm';
import { Review } from './review.entity';

describe('Review entity', () => {
  it('esta registrada como entidad de TypeORM', () => {
    // Arrange
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === Review,
    );

    // Act
    const isRegistered = table !== undefined;

    // Assert
    expect(isRegistered).toBe(true);
  });

  it('define columnas de transaccion, usuarios, calificacion, comentario y fecha', () => {
    // Arrange
    const columns = getMetadataArgsStorage().columns.filter(
      (column) => column.target === Review,
    );

    // Act
    const columnNames = columns.map((column) => column.propertyName);

    // Assert
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'transactionId',
        'reviewerId',
        'targetUserId',
        'rating',
        'comment',
        'createdAt',
      ]),
    );
  });

  it('mantiene unicidad por transaccion y reviewer', () => {
    // Arrange
    const uniques = getMetadataArgsStorage().uniques.filter(
      (entry) => entry.target === Review,
    );

    // Act
    const unique = uniques.find((entry) =>
      Array.isArray(entry.columns)
        ? entry.columns.includes('transactionId')
        : false,
    );

    // Assert
    expect(unique?.columns).toEqual(['transactionId', 'reviewerId']);
  });

  it('define relaciones con reviewer y targetUser con borrado en cascada', () => {
    // Arrange
    const relations = getMetadataArgsStorage().relations.filter(
      (entry) => entry.target === Review,
    );

    // Act
    const relationNames = relations.map((relation) => relation.propertyName);
    const allCascadeOnDelete = relations.every(
      (relation) => relation.options.onDelete === 'CASCADE',
    );

    // Assert
    expect(relationNames).toEqual(
      expect.arrayContaining(['reviewer', 'targetUser']),
    );
    expect(allCascadeOnDelete).toBe(true);
  });
});

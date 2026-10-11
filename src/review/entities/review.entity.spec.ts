import { getMetadataArgsStorage } from 'typeorm';
import { Review } from './review.entity';

describe('Review entity', () => {
  it('esta registrada como entidad de TypeORM', () => {
    // Arrange
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === Review,
    );

    // Act / Assert
    expect(table).toBeDefined();
  });

  it('define columnas de transaccion, calificacion, comentario y fecha', () => {
    // Arrange
    const columnNames = getMetadataArgsStorage()
      .columns.filter((column) => column.target === Review)
      .map((column) => column.propertyName);

    // Act / Assert
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'transactionId',
        'rating',
        'comment',
        'createdAt',
      ]),
    );
  });

  it('mantiene unicidad por transaccion y reviewer', () => {
    // Arrange
    const unique = getMetadataArgsStorage().uniques.find(
      (entry) => entry.target === Review,
    );

    // Act / Assert
    expect(unique?.columns).toEqual(['transactionId', 'reviewer']);
  });

  it('define relaciones con reviewer y targetUser con borrado en cascada', () => {
    // Arrange
    const relations = getMetadataArgsStorage().relations.filter(
      (entry) => entry.target === Review,
    );

    // Act / Assert
    expect(relations.map((relation) => relation.propertyName)).toEqual(
      expect.arrayContaining(['reviewer', 'targetUser']),
    );
    expect(
      relations.every((relation) => relation.options.onDelete === 'CASCADE'),
    ).toBe(true);
  });
});

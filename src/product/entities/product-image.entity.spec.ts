import { getMetadataArgsStorage } from 'typeorm';
import { ProductImageDto } from '../dto/product.dto';
import { ProductImage } from './product-image.entity';

describe('ProductImage entity', () => {
  it('esta registrada como entidad de TypeORM', () => {
    // Arrange
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === ProductImage,
    );

    // Act / Assert
    expect(table).toBeDefined();
  });

  it('define columnas necesarias para ordenar imagenes por producto', () => {
    // Arrange
    const columnNames = getMetadataArgsStorage()
      .columns.filter((column) => column.target === ProductImage)
      .map((column) => column.propertyName);

    // Act / Assert
    expect(columnNames).toEqual(
      expect.arrayContaining(['id', 'productId', 'url', 'position']),
    );
  });

  it('define relacion ManyToOne con Product', () => {
    // Arrange
    const relation = getMetadataArgsStorage().relations.find(
      (entry) =>
        entry.target === ProductImage && entry.propertyName === 'product',
    );

    // Act / Assert
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options).toMatchObject({ onDelete: 'CASCADE' });
  });

  it('ProductImageDto se construye desde la entidad', () => {
    // Arrange
    const image = { id: 'img-1', url: '/a.jpg', position: 0 } as ProductImage;

    // Act / Assert
    expect(ProductImageDto.fromEntity(image)).toEqual({
      id: 'img-1',
      url: '/a.jpg',
      position: 0,
    });
  });
});

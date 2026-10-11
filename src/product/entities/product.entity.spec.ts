import { getMetadataArgsStorage } from 'typeorm';
import { ProductDto } from '../dto/product.dto';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { fromGeoJson, toGeoJson } from '../interfaces/geo.interface';
import { Product } from './product.entity';

describe('Product entity', () => {
  const columns = getMetadataArgsStorage().columns;
  const relations = getMetadataArgsStorage().relations;

  it('esta registrada como entidad de TypeORM', () => {
    // Arrange
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === Product,
    );

    // Act / Assert
    expect(table).toBeDefined();
  });

  it('define columnas clave para feed, geolocalizacion y estado', () => {
    // Arrange
    const columnNames = columns
      .filter((column) => column.target === Product)
      .map((column) => column.propertyName);

    // Act / Assert
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'sellerId',
        'title',
        'description',
        'price',
        'category',
        'condition',
        'status',
        'location',
        'neighborhoodId',
        'estimatedWeightKg',
        'viewsCount',
      ]),
    );
  });

  it('configura location como geography Point SRID 4326', () => {
    // Arrange
    const location = columns.find(
      (column) =>
        column.target === Product && column.propertyName === 'location',
    );

    // Act / Assert
    expect(location?.options).toMatchObject({
      type: 'geography',
      spatialFeatureType: 'Point',
      srid: 4326,
    });
  });

  it('define relaciones con vendedor y favoritos', () => {
    // Arrange
    const relationNames = relations
      .filter((relation) => relation.target === Product)
      .map((relation) => relation.propertyName);

    // Act / Assert
    expect(relationNames).toEqual(
      expect.arrayContaining(['seller', 'favoritedBy']),
    );
    expect(relationNames).not.toContain('images');
  });

  it('convierte puntos entre API y GeoJSON preservando orden lng/lat', () => {
    // Arrange
    const apiPoint = { lat: 3.45, lng: -76.53 };

    // Act
    const geoJson = toGeoJson(apiPoint);
    const roundTrip = fromGeoJson(geoJson);

    // Assert
    expect(geoJson).toEqual({ type: 'Point', coordinates: [-76.53, 3.45] });
    expect(roundTrip).toEqual(apiPoint);
  });

  it('ProductDto aplica valores extra desde la entidad', () => {
    // Arrange
    const product = {
      id: 'p1',
      sellerId: 'user-1',
      title: 'Bici',
      description: 'Descripcion',
      price: 100,
      acceptsBarter: true,
      category: 'deportes',
      condition: ProductCondition.USED,
      status: ProductStatus.AVAILABLE,
      location: { type: 'Point', coordinates: [-76.5, 3.4] },
      neighborhoodId: 'granada',
      estimatedWeightKg: undefined,
      viewsCount: 7,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-02T00:00:00Z'),
    } as unknown as Product;

    // Act
    const result = ProductDto.fromEntity(product, {
      favoritesCount: 4,
      distanceKm: 1.25,
    });

    // Assert
    expect(result.location).toEqual({ lat: 3.4, lng: -76.5 });
    expect(result.estimatedWeightKg).toBeNull();
    expect(result.favoritesCount).toBe(4);
    expect(result.distanceKm).toBe(1.25);
  });
});

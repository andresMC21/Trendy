import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { fromGeoJson } from '../interfaces/geo.interface';
import { Product } from '../entities/product.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { GeoPointDto } from './geo-point.dto';

export class ProductDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del producto.',
  })
  id: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador del vendedor propietario del producto.',
  })
  sellerId: string;

  @ApiProperty({
    type: String,
    example: 'Bicicleta MTB {{neighborhoodId}}',
    description: 'Título del producto.',
  })
  title: string;

  @ApiProperty({
    type: String,
    example: 'Rin 26, cambios Shimano, poco uso',
    description: 'Descripción del producto.',
  })
  description: string;

  @ApiProperty({
    type: Number,
    example: 250000,
    description: 'Precio del producto.',
  })
  price: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si se acepta trueque.',
  })
  acceptsBarter: boolean;

  @ApiProperty({
    type: String,
    example: 'deportes',
    description: 'Categoría del producto.',
  })
  category: string;

  @ApiProperty({
    type: String,
    enum: ProductCondition,
    example: ProductCondition.LIKE_NEW,
    description: 'Condición del producto.',
  })
  condition: ProductCondition;

  @ApiProperty({
    type: String,
    enum: ProductStatus,
    example: ProductStatus.AVAILABLE,
    description: 'Estado actual del producto.',
  })
  status: ProductStatus;

  @ApiProperty({
    type: GeoPointDto,
    description: 'Ubicación geográfica del producto.',
  })
  location: GeoPointDto;

  @ApiProperty({
    type: String,
    example: '{{neighborhoodId}}',
    description: 'Identificador del barrio asociado al producto.',
  })
  neighborhoodId: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 14.5,
    description: 'Peso estimado en kilogramos o null si no se especificó.',
  })
  estimatedWeightKg: number | null;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Cantidad de usuarios que marcaron el producto como favorito.',
  })
  favoritesCount: number;

  @ApiProperty({
    type: Number,
    description: 'Cantidad de visitas al producto.',
  })
  viewsCount: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Distancia en kilómetros; solo aparece si se enviaron lat y lng.',
  })
  distanceKm?: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de publicación del producto.',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de la última actualización del producto.',
  })
  updatedAt: Date;

  static fromEntity(
    product: Product,
    extra: { favoritesCount?: number; distanceKm?: number } = {},
  ): ProductDto {
    const dto = new ProductDto();
    dto.id = product.id;
    dto.sellerId = product.sellerId;
    dto.title = product.title;
    dto.description = product.description;
    dto.price = product.price;
    dto.acceptsBarter = product.acceptsBarter;
    dto.category = product.category;
    dto.condition = product.condition;
    dto.status = product.status;
    dto.location = fromGeoJson(product.location);
    dto.neighborhoodId = product.neighborhoodId;
    dto.estimatedWeightKg = product.estimatedWeightKg ?? null;
    dto.favoritesCount = extra.favoritesCount ?? 0;
    dto.viewsCount = product.viewsCount;
    if (extra.distanceKm !== undefined) dto.distanceKm = extra.distanceKm;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}

export class ProductSellerDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del vendedor.',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Vendedor Postman',
    description: 'Nombre completo del vendedor.',
  })
  fullName: string;

  @ApiProperty({
    type: Number,
    description: 'Promedio de calificaciones recibidas por el vendedor.',
  })
  ratingAverage: number;

  @ApiProperty({
    type: Number,
    description: 'Cantidad de reseñas recibidas por el vendedor.',
  })
  reviewsCount: number;
}

export class ProductDetailDto extends ProductDto {
  @ApiProperty({
    type: ProductSellerDto,
    description: 'Perfil público del vendedor.',
  })
  seller: ProductSellerDto;
}

export class PaginatedProductsDto {
  @ApiProperty({
    type: [ProductDto],
    description: 'Productos incluidos en la página actual.',
  })
  items: ProductDto[];

  @ApiProperty({
    type: Number,
    example: 4,
    description: 'Cantidad total de productos que coinciden con los filtros.',
  })
  total: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Número de página devuelto.',
  })
  page: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Cantidad de productos por página.',
  })
  limit: number;
}

export class FavoriteResultDto {
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Nuevo estado del favorito para el usuario autenticado.',
  })
  isFavorite: boolean;
}

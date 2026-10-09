import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { fromGeoJson } from '../interfaces/geo.interface';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { GeoPointDto } from './geo-point.dto';

export class ProductImageDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: '/uploads/products/3f2a.jpg' }) url: string;
  @ApiProperty({ example: 0 }) position: number;

  static fromEntity(image: ProductImage): ProductImageDto {
    return { id: image.id, url: image.url, position: image.position };
  }
}

export class ProductDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() sellerId: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty({ example: 250000 }) price: number;
  @ApiProperty() acceptsBarter: boolean;
  @ApiProperty() category: string;
  @ApiProperty({ enum: ProductCondition }) condition: ProductCondition;
  @ApiProperty({ enum: ProductStatus }) status: ProductStatus;
  @ApiProperty({ type: GeoPointDto }) location: GeoPointDto;
  @ApiProperty() neighborhoodId: string;
  @ApiProperty({ nullable: true, type: Number }) estimatedWeightKg: number | null;
  @ApiProperty({ type: [ProductImageDto] }) images: ProductImageDto[];
  @ApiProperty({ example: 3 }) favoritesCount: number;
  @ApiProperty({ example: 10 }) viewsCount: number;
  @ApiPropertyOptional({ example: 1.37, description: 'Distancia en km (solo si se envió lat/lng)' })
  distanceKm?: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

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
    dto.images = (product.images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(ProductImageDto.fromEntity);
    dto.favoritesCount = extra.favoritesCount ?? 0;
    dto.viewsCount = product.viewsCount;
    if (extra.distanceKm !== undefined) dto.distanceKm = extra.distanceKm;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}

export class ProductSellerDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;
  @ApiProperty({ example: 4.8 }) ratingAverage: number;
  @ApiProperty({ example: 12 }) reviewsCount: number;
}

export class ProductDetailDto extends ProductDto {
  @ApiProperty({ type: ProductSellerDto }) seller: ProductSellerDto;
}

export class PaginatedProductsDto {
  @ApiProperty({ type: [ProductDto] }) items: ProductDto[];
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
}

export class FavoriteResultDto {
  @ApiProperty({ example: true }) isFavorite: boolean;
}

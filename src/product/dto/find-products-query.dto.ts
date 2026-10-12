import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductSort } from '../enums/product-sort.enum';

export class FindProductsQueryDto {
  @ApiPropertyOptional({
    type: String,
    example: '{{neighborhoodId}}',
    description: 'Filtra por el identificador del barrio.',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 3.452,
    minimum: -90,
    maximum: 90,
    description: 'Latitud del punto de búsqueda; requiere lng.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({
    type: Number,
    example: -76.531,
    minimum: -180,
    maximum: 180,
    description: 'Longitud del punto de búsqueda; requiere lat.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    default: 5,
    minimum: 0.1,
    maximum: 50,
    description:
      'Radio de búsqueda en kilómetros (de 0.1 a 50); aplica solo con lat y lng.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'LIBROS',
    description: 'Filtra por categoría.',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: String,
    enum: ProductCondition,
    example: ProductCondition.USED,
    description: 'Filtra por condición del producto.',
  })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional({
    type: String,
    enum: ProductSort,
    example: ProductSort.PRICE_ASC,
    default: ProductSort.RECENT,
    description: 'Criterio de orden; distance requiere lat y lng.',
  })
  @IsOptional()
  @IsEnum(ProductSort)
  sort?: ProductSort;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    default: 1,
    minimum: 1,
    description: 'Número de página, empezando en 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    default: 20,
    minimum: 1,
    maximum: 50,
    description: 'Cantidad de productos por página (de 1 a 50).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

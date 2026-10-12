import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProductCondition } from '../enums/product-condition.enum';
import { GeoPointDto } from './geo-point.dto';

export class CreateProductDto {
  @ApiProperty({
    type: String,
    example: 'Bicicleta MTB {{neighborhoodId}}',
    minLength: 3,
    maxLength: 120,
    description: 'Título del producto, entre 3 y 120 caracteres.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    type: String,
    example: 'Rin 26, cambios Shimano, poco uso',
    maxLength: 2000,
    description: 'Descripción del producto, de hasta 2000 caracteres.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    type: Number,
    example: 250000,
    default: 0,
    minimum: 0,
    maximum: 9999999999,
    multipleOf: 0.01,
    description:
      'Precio con hasta dos decimales; usa 0 para donación o trueque.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999)
  price?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    default: false,
    description: 'Indica si se acepta trueque.',
  })
  @IsOptional()
  @IsBoolean()
  acceptsBarter?: boolean;

  @ApiProperty({
    type: String,
    example: 'deportes',
    maxLength: 60,
    description: 'Categoría del producto, de hasta 60 caracteres.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category: string;

  @ApiProperty({
    type: String,
    enum: ProductCondition,
    example: ProductCondition.LIKE_NEW,
    description: 'Condición del producto.',
  })
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @ApiProperty({
    type: GeoPointDto,
    description: 'Ubicación geográfica expresada como latitud y longitud.',
  })
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;

  @ApiProperty({
    type: String,
    example: '{{neighborhoodId}}',
    description: 'Identificador del barrio usado para el filtro hiperlocal.',
  })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5,
    minimum: 0,
    maximum: 100000,
    exclusiveMinimum: true,
    description:
      'Peso estimado en kilogramos para calcular el impacto ambiental.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(100000)
  estimatedWeightKg?: number;
}

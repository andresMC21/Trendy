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
  @ApiProperty({ example: 'Bicicleta de montaña rin 26', minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Poco uso, cambios Shimano, lista para rodar.', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ example: 250000, default: 0, description: '0 si es donación o trueque' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999)
  price?: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  acceptsBarter?: boolean;

  @ApiProperty({ example: 'deportes', maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category: string;

  @ApiProperty({ enum: ProductCondition, example: ProductCondition.LIKE_NEW })
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @ApiProperty({ type: GeoPointDto })
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;

  @ApiProperty({ example: 'barrio-granada', description: 'Id del barrio (filtro hiperlocal)' })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiPropertyOptional({ example: 12.5, description: 'Peso estimado en kg (impacto ambiental)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(100000)
  estimatedWeightKg?: number;
}

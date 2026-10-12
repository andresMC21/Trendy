import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 5,
    description: 'Cantidad máxima de usuarios por página (de 1 a 100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    default: 0,
    example: 0,
    description:
      'Cantidad de usuarios que se omiten antes de iniciar la página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;
}

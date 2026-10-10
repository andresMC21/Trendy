import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';
import { GeoPoint } from '../interfaces/geo.interface';

export class GeoPointDto implements GeoPoint {
  @ApiProperty({ example: 3.4516, description: 'Latitud (-90 a 90)' })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: -76.532, description: 'Longitud (-180 a 180)' })
  @IsLongitude()
  lng: number;
}

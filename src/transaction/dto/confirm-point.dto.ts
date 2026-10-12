import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPointDto {
  @ApiProperty({
    type: String,
    example: 'sp-1',
    minLength: 1,
    description: 'Identificador del punto seguro donde se encontrarán.',
  })
  @IsString()
  @IsNotEmpty()
  safePointId: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2030-10-05T15:00:00Z',
    description: 'Fecha y hora del encuentro en formato de fecha ISO 8601.',
  })
  @IsDateString()
  scheduledTime: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPointDto {
  @ApiProperty({ example: '12345' })
  @IsString()
  @IsNotEmpty()
  safePointId: string;

  @ApiProperty({ example: '2026-10-05T15:00:00Z' })
  @IsDateString()
  scheduledTime: string;
}

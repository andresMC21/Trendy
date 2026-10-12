import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetActiveStatus {
  @ApiProperty({ description: 'false desactiva; true reactiva la cuenta' })
  @IsBoolean()
  isActive: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetActiveStatus {
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'false desactiva la cuenta; true la reactiva.',
  })
  @IsBoolean()
  isActive: boolean;
}

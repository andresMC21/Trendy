import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class TransactionUserDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del participante.',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Nombre completo del participante.',
  })
  fullName: string;

  static fromEntity(user?: User): TransactionUserDto | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      fullName: user.fullName,
    };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class TransactionUserDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;

  static fromEntity(user?: User): TransactionUserDto | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      fullName: user.fullName,
      photoUrl: user.photoUrl ?? null,
    };
  }
}

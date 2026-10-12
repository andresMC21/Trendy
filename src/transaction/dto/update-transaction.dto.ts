import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class UpdateTransactionDto {
  @ApiProperty({
    type: String,
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    description:
      'Estado solicitado: PENDING, AGREED_POINT, COMPLETED o CANCELLED. La transición debe estar permitida desde el estado actual.',
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}

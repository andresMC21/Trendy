import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductDto } from '../../product/dto/product.dto';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionUserDto } from './transaction-user.dto';

export class TransactionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) productId: string;
  @ApiProperty() buyerId: string;
  @ApiProperty() sellerId: string;
  @ApiProperty({ enum: TransactionStatus }) status: TransactionStatus;
  @ApiProperty({ nullable: true, type: String }) safePointId: string | null;
  @ApiProperty({ nullable: true, type: Date }) scheduledTime: Date | null;
  @ApiPropertyOptional({ type: ProductDto }) product?: ProductDto;
  @ApiPropertyOptional({ type: TransactionUserDto }) buyer?: TransactionUserDto;
  @ApiPropertyOptional({ type: TransactionUserDto }) seller?: TransactionUserDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(transaction: Transaction): TransactionDto {
    const dto = new TransactionDto();
    dto.id = transaction.id;
    dto.productId = transaction.productId;
    dto.buyerId = transaction.buyerId;
    dto.sellerId = transaction.sellerId;
    dto.status = transaction.status;
    dto.safePointId = transaction.safePointId;
    dto.scheduledTime = transaction.scheduledTime;
    if (transaction.product) dto.product = ProductDto.fromEntity(transaction.product);
    dto.buyer = TransactionUserDto.fromEntity(transaction.buyer);
    dto.seller = TransactionUserDto.fromEntity(transaction.seller);
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    return dto;
  }
}

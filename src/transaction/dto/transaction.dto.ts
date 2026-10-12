import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductDto } from '../../product/dto/product.dto';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionUserDto } from './transaction-user.dto';

export class TransactionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único de la transacción.',
  })
  id: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador del producto asociado.',
  })
  productId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador del comprador.',
  })
  buyerId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador del vendedor.',
  })
  sellerId: string;

  @ApiProperty({
    type: String,
    enum: TransactionStatus,
    example: TransactionStatus.PENDING,
    description: 'Estado actual de la transacción.',
  })
  status: TransactionStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'sp-1',
    description:
      'Identificador del punto de encuentro o null si no se definió.',
  })
  safePointId: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2030-10-05T15:00:00Z',
    description:
      'Fecha y hora programada para el encuentro o null si no se definió.',
  })
  scheduledTime: Date | null;

  @ApiPropertyOptional({
    type: ProductDto,
    description:
      'Producto relacionado; se incluye cuando la operación carga la relación.',
  })
  product?: ProductDto;

  @ApiPropertyOptional({
    type: TransactionUserDto,
    description:
      'Perfil público del comprador; se incluye cuando la operación carga la relación.',
  })
  buyer?: TransactionUserDto;

  @ApiPropertyOptional({
    type: TransactionUserDto,
    description:
      'Perfil público del vendedor; se incluye cuando la operación carga la relación.',
  })
  seller?: TransactionUserDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de creación de la transacción.',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de la última actualización.',
  })
  updatedAt: Date;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Me interesa, ¿sigue disponible?',
    description:
      'Mensaje opcional enviado por el comprador o null si no envió.',
  })
  message: string | null;

  static fromEntity(transaction: Transaction): TransactionDto {
    const dto = new TransactionDto();
    dto.id = transaction.id;
    dto.productId = transaction.productId;
    dto.buyerId = transaction.buyerId;
    dto.sellerId = transaction.sellerId;
    dto.status = transaction.status;
    dto.safePointId = transaction.safePointId;
    dto.scheduledTime = transaction.scheduledTime;
    if (transaction.product)
      dto.product = ProductDto.fromEntity(transaction.product);
    dto.buyer = TransactionUserDto.fromEntity(transaction.buyer);
    dto.seller = TransactionUserDto.fromEntity(transaction.seller);
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    dto.message = transaction.message;
    return dto;
  }
}

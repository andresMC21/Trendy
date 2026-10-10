import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductStatus } from '../product/enums/product-status.enum';
import { ProductService } from '../product/product.service';
import { ConfirmPointDto } from './dto/confirm-point.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';

const ACTIVE_TRANSACTION_STATUSES = [
  TransactionStatus.PENDING,
  TransactionStatus.AGREED_POINT,
];

const ALLOWED_STATUS_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  [TransactionStatus.PENDING]: [
    TransactionStatus.AGREED_POINT,
    TransactionStatus.CANCELLED,
  ],
  [TransactionStatus.AGREED_POINT]: [
    TransactionStatus.COMPLETED,
    TransactionStatus.CANCELLED,
  ],
  [TransactionStatus.COMPLETED]: [],
  [TransactionStatus.CANCELLED]: [],
};

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly productService: ProductService,
  ) {}

  async create(
    buyerId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    const product = await this.productService.findById(createTransactionDto.productId);

    if (product.sellerId === buyerId) {
      throw new ForbiddenException('No puedes iniciar una transaccion sobre tu propio producto');
    }
    if (product.status !== ProductStatus.AVAILABLE) {
      throw new ConflictException(`El producto no esta disponible: ${product.status}`);
    }

    const active = await this.transactionRepository.findOne({
      where: {
        productId: product.id,
        status: In(ACTIVE_TRANSACTION_STATUSES),
      },
    });
    if (active) {
      throw new ConflictException('El producto ya tiene una transaccion activa');
    }

    const transaction = this.transactionRepository.create({
      productId: product.id,
      buyerId,
      sellerId: product.sellerId,
      status: TransactionStatus.PENDING,
    });

    await this.productService.updateStatus(product.id, ProductStatus.RESERVED);
    try {
      const saved = await this.transactionRepository.save(transaction);
      saved.product = product;
      return TransactionDto.fromEntity(saved);
    } catch (error) {
      await this.productService.updateStatus(product.id, ProductStatus.AVAILABLE);
      throw error;
    }
  }

  async findAll(userId: string): Promise<TransactionDto[]> {
    const transactions = await this.transactionRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: {
        product: { images: true },
        buyer: true,
        seller: true,
      },
      order: { updatedAt: 'DESC' },
    });
    return transactions.map(TransactionDto.fromEntity);
  }

  async findOne(id: string, userId: string): Promise<TransactionDto> {
    const transaction = await this.findEntity(id);
    this.assertParticipant(transaction, userId);
    return TransactionDto.fromEntity(transaction);
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const transaction = await this.findEntity(id);
    this.assertParticipant(transaction, userId);
    this.assertTransition(transaction.status, updateTransactionDto.status);

    if (
      updateTransactionDto.status === TransactionStatus.AGREED_POINT &&
      (!transaction.safePointId || !transaction.scheduledTime)
    ) {
      throw new BadRequestException('Confirma un punto seguro antes de pasar a AGREED_POINT');
    }

    transaction.status = updateTransactionDto.status;
    const saved = await this.transactionRepository.save(transaction);

    if (saved.status === TransactionStatus.COMPLETED) {
      await this.productService.updateStatus(saved.productId, ProductStatus.SOLD);
    }
    if (saved.status === TransactionStatus.CANCELLED) {
      await this.productService.updateStatus(saved.productId, ProductStatus.AVAILABLE);
    }

    return TransactionDto.fromEntity(saved);
  }

  async confirmPoint(
    id: string,
    userId: string,
    confirmPointDto: ConfirmPointDto,
  ): Promise<TransactionDto> {
    const transaction = await this.findEntity(id);
    this.assertParticipant(transaction, userId);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new ConflictException('Solo transacciones PENDING pueden confirmar punto');
    }

    const scheduledTime = new Date(confirmPointDto.scheduledTime);
    if (Number.isNaN(scheduledTime.getTime())) {
      throw new BadRequestException('scheduledTime debe ser una fecha ISO valida');
    }

    transaction.safePointId = confirmPointDto.safePointId;
    transaction.scheduledTime = scheduledTime;
    transaction.status = TransactionStatus.AGREED_POINT;

    const saved = await this.transactionRepository.save(transaction);
    return TransactionDto.fromEntity(saved);
  }

  private async findEntity(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: {
        product: { images: true },
        buyer: true,
        seller: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return transaction;
  }

  private assertParticipant(transaction: Transaction, userId: string): void {
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException('Solo los participantes pueden ver o modificar esta transaccion');
    }
  }

  private assertTransition(from: TransactionStatus, to: TransactionStatus): void {
    if (from === to) return;
    if (!ALLOWED_STATUS_TRANSITIONS[from].includes(to)) {
      throw new ConflictException(`Transicion de estado invalida: ${from} -> ${to}`);
    }
  }
}

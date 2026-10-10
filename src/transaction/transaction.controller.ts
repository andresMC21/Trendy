import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../user/decorators/auth.decorator';
import { GetUser } from '../user/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { ConfirmPointDto } from './dto/confirm-point.dto';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Iniciar una intencion de compra o trueque' })
  @ApiCreatedResponse({ type: TransactionDto })
  @ApiConflictResponse({ description: 'Producto no disponible o ya reservado' })
  @ApiForbiddenResponse({ description: 'El usuario intenta comprar su propio producto' })
  create(@GetUser() user: User, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(user.id, createTransactionDto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Listar transacciones del usuario autenticado' })
  @ApiOkResponse({ type: [TransactionDto] })
  findAll(@GetUser() user: User) {
    return this.transactionService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Detalle de una transaccion' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionDto })
  @ApiNotFoundResponse({ description: 'Transaccion no encontrada' })
  @ApiForbiddenResponse({ description: 'El usuario no participa en la transaccion' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.transactionService.findOne(id, user.id);
  }

  @Put(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar estado de la transaccion',
    description: 'Transiciones validas: PENDING -> CANCELLED, AGREED_POINT -> COMPLETED/CANCELLED.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionDto })
  @ApiBadRequestResponse({ description: 'Falta confirmar punto para AGREED_POINT' })
  @ApiConflictResponse({ description: 'Transicion de estado invalida' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, user.id, updateTransactionDto);
  }

  @Post(':id/confirm-point')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar punto seguro y horario de encuentro' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionDto })
  @ApiConflictResponse({ description: 'La transaccion no esta PENDING' })
  confirmPoint(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() confirmPointDto: ConfirmPointDto,
  ) {
    return this.transactionService.confirmPoint(id, user.id, confirmPointDto);
  }
}

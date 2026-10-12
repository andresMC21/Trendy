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
  @ApiOperation({
    summary: 'Iniciar una intención de compra o trueque',
    description:
      'Requiere JWT. El usuario autenticado queda como comprador; el vendedor se obtiene del producto. La transacción inicia en PENDING y el producto queda reservado.',
  })
  @ApiCreatedResponse({ type: TransactionDto })
  @ApiBadRequestResponse({
    description: 'El cuerpo no es válido o productId no tiene formato UUID',
  })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({ description: 'Producto no disponible o ya reservado' })
  @ApiForbiddenResponse({
    description: 'El usuario intenta comprar su propio producto',
  })
  create(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(user.id, createTransactionDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar las transacciones del usuario autenticado',
    description:
      'Requiere JWT. Incluye las transacciones en las que participa como comprador o vendedor, ordenadas por última actualización.',
  })
  @ApiOkResponse({ type: [TransactionDto] })
  findAll(@GetUser() user: User) {
    return this.transactionService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Consultar una transacción',
    description:
      'Solo pueden consultarla el comprador y el vendedor participantes.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id de la transacción' })
  @ApiOkResponse({ type: TransactionDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Transacción no encontrada' })
  @ApiForbiddenResponse({
    description: 'El usuario no participa en la transacción',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.transactionService.findOne(id, user.id);
  }

  @Put(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar estado de la transacción',
    description:
      'Transiciones válidas: PENDING -> AGREED_POINT/CANCELLED y AGREED_POINT -> COMPLETED/CANCELLED. Para pasar a AGREED_POINT deben existir un punto seguro y un horario confirmados.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id de la transacción' })
  @ApiOkResponse({ type: TransactionDto })
  @ApiBadRequestResponse({
    description:
      'El id o el estado no son válidos, o falta confirmar punto para AGREED_POINT',
  })
  @ApiNotFoundResponse({ description: 'Transacción no encontrada' })
  @ApiForbiddenResponse({
    description: 'El usuario no participa en la transacción',
  })
  @ApiConflictResponse({ description: 'Transición de estado inválida' })
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
  @ApiOperation({
    summary: 'Confirmar punto seguro y horario de encuentro',
    description:
      'Cualquier participante puede registrar el punto y el horario mientras la transacción esté PENDING. La operación cambia el estado a AGREED_POINT.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id de la transacción' })
  @ApiOkResponse({ type: TransactionDto })
  @ApiBadRequestResponse({
    description: 'El id, el punto o la fecha programada no son válidos',
  })
  @ApiNotFoundResponse({ description: 'Transacción no encontrada' })
  @ApiForbiddenResponse({
    description: 'El usuario no participa en la transacción',
  })
  @ApiConflictResponse({ description: 'La transacción no está PENDING' })
  confirmPoint(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() confirmPointDto: ConfirmPointDto,
  ) {
    return this.transactionService.confirmPoint(id, user.id, confirmPointDto);
  }
}

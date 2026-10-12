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
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

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
  @ApiBody({
    type: CreateTransactionDto,
    description:
      'Identificador del producto y mensaje opcional para el vendedor.',
  })
  @ApiCreatedResponse({
    type: TransactionDto,
    description:
      'La intención se creó en estado PENDING y el producto quedó reservado.',
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no es válido, productId no tiene formato UUID o message supera 500 caracteres.',
  })
  @ApiNotFoundResponse({
    description: 'No existe el producto indicado.',
  })
  @ApiConflictResponse({
    description:
      'El producto no está disponible o ya tiene una transacción activa.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado intenta comprar su propio producto.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al crear la transacción.',
  })
  create(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.create(user.id, createTransactionDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar las transacciones del usuario autenticado',
    description:
      'Requiere JWT. Incluye las transacciones en las que participa como comprador o vendedor, ordenadas por última actualización.',
  })
  @ApiOkResponse({
    type: [TransactionDto],
    description:
      'Lista las transacciones en las que participa el usuario autenticado; puede estar vacía.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar las transacciones.',
  })
  findAll(@GetUser() user: User): Promise<TransactionDto[]> {
    return this.transactionService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Consultar una transacción',
    description: 'Requiere JWT. Solo pueden consultarla sus participantes.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description: 'Se devuelve la transacción y sus datos relacionados.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la transacción no tiene formato UUID.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar la transacción.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<TransactionDto> {
    return this.transactionService.findOne(id, user.id);
  }

  @Put(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar estado de la transacción',
    description:
      'Requiere JWT y participación en la transacción. Transiciones válidas: PENDING → AGREED_POINT/CANCELLED y AGREED_POINT → COMPLETED/CANCELLED. Para pasar a AGREED_POINT deben existir un punto seguro y un horario confirmados.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiBody({
    type: UpdateTransactionDto,
    description: 'Nuevo estado solicitado para la transacción.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description: 'La transacción se actualizó al estado solicitado.',
  })
  @ApiBadRequestResponse({
    description:
      'El identificador o el estado no son válidos, o faltan el punto seguro y el horario para pasar a AGREED_POINT.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiConflictResponse({
    description:
      'La transición solicitada no está permitida desde el estado actual.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al actualizar la transacción.',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.update(id, user.id, updateTransactionDto);
  }

  @Post(':id/confirm-point')
  @Auth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Confirmar punto seguro y horario de encuentro',
    description:
      'Requiere JWT y participación en la transacción. Cualquier participante puede registrar el punto y el horario mientras la transacción esté PENDING. La operación cambia el estado a AGREED_POINT.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiBody({
    type: ConfirmPointDto,
    description: 'Punto seguro y fecha/hora programada para el encuentro.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description:
      'El punto y la fecha se guardaron y la transacción pasó a AGREED_POINT.',
  })
  @ApiBadRequestResponse({
    description:
      'El identificador, el punto seguro o la fecha programada no son válidos.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiConflictResponse({
    description: 'La transacción no está en estado PENDING.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al confirmar el punto de encuentro.',
  })
  confirmPoint(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() confirmPointDto: ConfirmPointDto,
  ): Promise<TransactionDto> {
    return this.transactionService.confirmPoint(id, user.id, confirmPointDto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../user/decorators/auth.decorator';
import { GetUser } from '../user/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Crear una reseña para una transacción completada',
    description:
      'Solo pueden reseñar los participantes de la transacción. Cada participante puede dejar una reseña para la contraparte; el promedio y el conteo de reseñas de esta se recalculan.',
  })
  @ApiCreatedResponse({ type: ReviewDto })
  @ApiBadRequestResponse({
    description: 'El cuerpo es inválido o el transactionId no tiene formato UUID',
  })
  @ApiNotFoundResponse({ description: 'La transacción no existe' })
  @ApiConflictResponse({
    description:
      'La transacción no está completada o el usuario ya la reseñó',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no participa en la transacción',
  })
  create(@GetUser() user: User, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(user.id, createReviewDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar reseñas escritas o recibidas por el usuario autenticado',
    description:
      'Devuelve ambas direcciones de reseñas, ordenadas de la más reciente a la más antigua.',
  })
  @ApiOkResponse({ type: [ReviewDto] })
  findAll(@GetUser() user: User) {
    return this.reviewService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Consultar una reseña',
    description: 'Solo pueden verla quien la escribió y quien la recibió.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id de la reseña' })
  @ApiOkResponse({ type: ReviewDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Reseña no encontrada' })
  @ApiForbiddenResponse({
    description: 'El usuario no escribió ni recibió esta reseña',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reviewService.findOne(id, user.id);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar una reseña propia',
    description:
      'Solo el autor puede modificarla. Se pueden actualizar rating y/o comment; enviar comment como null lo elimina. El promedio y el conteo de reseñas de la persona evaluada se recalculan.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id de la reseña' })
  @ApiOkResponse({ type: ReviewDto })
  @ApiBadRequestResponse({
    description: 'El id o el cuerpo de la solicitud es inválido',
  })
  @ApiNotFoundResponse({ description: 'Reseña no encontrada' })
  @ApiForbiddenResponse({ description: 'Solo el autor puede modificarla' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.update(id, user.id, updateReviewDto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar una reseña propia',
    description:
      'Solo el autor puede eliminarla. El promedio y el conteo de reseñas de la persona evaluada se recalculan.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id de la reseña' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Reseña no encontrada' })
  @ApiForbiddenResponse({ description: 'Solo el autor puede eliminarla' })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reviewService.remove(id, user.id);
  }
}

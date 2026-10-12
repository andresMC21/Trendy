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
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
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
      'Requiere JWT. Solo pueden reseñar los participantes de una transacción completada. Cada participante puede dejar una reseña para la contraparte; el promedio y el conteo de reseñas de esta se recalculan.',
  })
  @ApiBody({
    type: CreateReviewDto,
    description: 'Transacción completada, calificación y comentario opcional.',
  })
  @ApiCreatedResponse({
    type: ReviewDto,
    description: 'La reseña se creó para la contraparte de la transacción.',
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no cumple las validaciones: transactionId debe ser UUID, rating un entero de 1 a 5 y comment una cadena de hasta 1000 caracteres.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con el identificador indicado.',
  })
  @ApiConflictResponse({
    description:
      'La transacción no está completada o el usuario ya creó una reseña para ella.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Error inesperado al crear la reseña o actualizar la calificación.',
  })
  create(
    @GetUser() user: User,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.create(user.id, createReviewDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar reseñas escritas o recibidas por el usuario autenticado',
    description:
      'Requiere JWT. Devuelve reseñas escritas y recibidas por el usuario autenticado, ordenadas de la más reciente a la más antigua.',
  })
  @ApiOkResponse({
    type: [ReviewDto],
    description:
      'Lista de reseñas escritas o recibidas por el usuario; puede estar vacía.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar las reseñas.',
  })
  findAll(@GetUser() user: User): Promise<ReviewDto[]> {
    return this.reviewService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Consultar una reseña',
    description:
      'Requiere JWT. Solo pueden verla quien la escribió y quien la recibió.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '{{reviewId}}',
    description: 'Identificador UUID de la reseña.',
  })
  @ApiOkResponse({
    type: ReviewDto,
    description: 'Se devuelve la reseña solicitada.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la reseña no tiene formato UUID.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una reseña con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no escribió ni recibió esta reseña.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar la reseña.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<ReviewDto> {
    return this.reviewService.findOne(id, user.id);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar una reseña propia',
    description:
      'Requiere JWT. Solo el autor puede modificarla. Se pueden actualizar rating y/o comment; enviar comment como null lo elimina. El promedio y el conteo de reseñas de la persona evaluada se recalculan.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '{{reviewId}}',
    description: 'Identificador UUID de la reseña que se desea actualizar.',
  })
  @ApiBody({
    type: UpdateReviewDto,
    description: 'Campos rating y/o comment que se desean modificar.',
  })
  @ApiOkResponse({
    type: ReviewDto,
    description: 'La reseña se actualizó y se devuelve con sus nuevos valores.',
  })
  @ApiBadRequestResponse({
    description:
      'El identificador no tiene formato UUID o el cuerpo contiene valores no válidos.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una reseña con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no es el autor de la reseña.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Error inesperado al actualizar la reseña o recalcular la calificación.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.update(id, user.id, updateReviewDto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar una reseña propia',
    description:
      'Requiere JWT. Solo el autor puede eliminarla. El promedio y el conteo de reseñas de la persona evaluada se recalculan.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '{{reviewId}}',
    description: 'Identificador UUID de la reseña que se desea eliminar.',
  })
  @ApiNoContentResponse({
    description: 'La reseña se eliminó; la respuesta no tiene cuerpo.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la reseña no tiene formato UUID.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una reseña con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no es el autor de la reseña.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Error inesperado al eliminar la reseña o recalcular la calificación.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.reviewService.remove(id, user.id);
  }
}

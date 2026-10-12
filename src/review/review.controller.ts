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
  @ApiOperation({ summary: 'Crear reseña para una transaccion completada' })
  @ApiCreatedResponse({ type: ReviewDto })
  @ApiConflictResponse({
    description: 'La transaccion no esta completada o ya fue reseñada',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no participa en la transaccion',
  })
  create(@GetUser() user: User, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(user.id, createReviewDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar reseñas hechas o recibidas por el usuario autenticado',
  })
  @ApiOkResponse({ type: [ReviewDto] })
  findAll(@GetUser() user: User) {
    return this.reviewService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Detalle de una reseña' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ReviewDto })
  @ApiNotFoundResponse({ description: 'Reseña no encontrada' })
  @ApiForbiddenResponse({ description: 'El usuario no puede ver esta reseña' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reviewService.findOne(id, user.id);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Actualizar una reseña propia' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ReviewDto })
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
  @ApiOperation({ summary: 'Eliminar una reseña propia' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reviewService.remove(id, user.id);
  }
}

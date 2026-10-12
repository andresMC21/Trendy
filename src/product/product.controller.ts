import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Auth } from '../user/decorators/auth.decorator';
import { GetUser } from '../user/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';

import {
  FavoriteResultDto,
  PaginatedProductsDto,
  ProductDetailDto,
  ProductDto,
} from './dto/product.dto';

import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { ProductCondition } from './enums/product-condition.enum';
import { ProductSort } from './enums/product-sort.enum';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Feed de productos',
    description:
      'Público, no requiere JWT. Devuelve únicamente productos AVAILABLE. lat y lng deben enviarse juntos; radius se interpreta en kilómetros y solo aplica con ambos. sort=distance también requiere coordenadas.',
  })
  @ApiQuery({
    name: 'neighborhood',
    type: String,
    required: false,
    example: '{{neighborhoodId}}',
    description: 'Filtra por el identificador del barrio.',
  })
  @ApiQuery({
    name: 'lat',
    type: Number,
    required: false,
    example: 3.452,
    description: 'Latitud del punto de búsqueda; debe enviarse junto con lng.',
  })
  @ApiQuery({
    name: 'lng',
    type: Number,
    required: false,
    example: -76.531,
    description: 'Longitud del punto de búsqueda; debe enviarse junto con lat.',
  })
  @ApiQuery({
    name: 'radius',
    type: Number,
    required: false,
    example: 2,
    description:
      'Radio de búsqueda en kilómetros (de 0.1 a 50); solo aplica con lat y lng.',
  })
  @ApiQuery({
    name: 'category',
    type: String,
    required: false,
    example: 'LIBROS',
    description: 'Filtra por categoría.',
  })
  @ApiQuery({
    name: 'condition',
    type: String,
    enum: ProductCondition,
    required: false,
    example: ProductCondition.USED,
    description: 'Filtra por condición del producto.',
  })
  @ApiQuery({
    name: 'sort',
    type: String,
    enum: ProductSort,
    required: false,
    example: ProductSort.PRICE_ASC,
    description:
      'Ordena por fecha, precio, distancia o popularidad. distance requiere lat y lng.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 2,
    description: 'Número de página, empezando en 1.',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 2,
    description: 'Cantidad de productos por página (de 1 a 50).',
  })
  @ApiOkResponse({
    type: PaginatedProductsDto,
    description:
      'Feed paginado con productos AVAILABLE que coinciden con los filtros.',
  })
  @ApiBadRequestResponse({
    description:
      'Algún filtro no es válido, falta lat o lng, o se solicita sort=distance sin coordenadas.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar el feed de productos.',
  })
  findAll(@Query() query: FindProductsQueryDto): Promise<PaginatedProductsDto> {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de un producto',
    description:
      'Público, no requiere JWT. Devuelve el producto y el perfil público del vendedor; cada consulta suma una visita.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del producto.',
  })
  @ApiOkResponse({
    type: ProductDetailDto,
    description: 'Se devuelve el detalle del producto y su vendedor.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador del producto no tiene formato UUID.',
  })
  @ApiNotFoundResponse({
    description: 'No existe un producto con ese identificador o fue eliminado.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar el producto.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDetailDto> {
    return this.productService.findOne(id);
  }

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Publicar un producto',
    description:
      'Requiere JWT. El vendedor se toma del usuario autenticado; el producto inicia en estado AVAILABLE. Si no se especifican price y acceptsBarter, se usan 0 y false.',
  })
  @ApiBody({
    type: CreateProductDto,
    description: 'Datos del producto que se desea publicar.',
  })
  @ApiCreatedResponse({
    type: ProductDto,
    description: 'El producto se creó en estado AVAILABLE.',
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo contiene campos no permitidos o valores que no cumplen las validaciones.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al crear el producto.',
  })
  create(
    @GetUser() user: User,
    @Body() dto: CreateProductDto,
  ): Promise<ProductDto> {
    return this.productService.create(user.id, dto);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({
    summary: 'Editar un producto',
    description:
      'Requiere JWT. Solo el vendedor puede editar el producto y únicamente mientras esté AVAILABLE.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del producto que se desea editar.',
  })
  @ApiBody({
    type: UpdateProductDto,
    description: 'Campos del producto que se desean actualizar.',
  })
  @ApiOkResponse({
    type: ProductDto,
    description: 'El producto se actualizó correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador o el cuerpo no cumplen las validaciones.',
  })
  @ApiNotFoundResponse({
    description: 'No existe un producto con ese identificador o fue eliminado.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no es el vendedor del producto.',
  })
  @ApiConflictResponse({
    description:
      'El producto no está AVAILABLE y no se puede editar en su estado actual.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al actualizar el producto.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.productService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar un producto (borrado lógico)',
    description:
      'Requiere JWT. El vendedor o un ADMIN/MODERATOR pueden eliminarlo solo mientras esté AVAILABLE. Se conserva el registro y se cambia el estado a REMOVED.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del producto que se desea eliminar.',
  })
  @ApiNoContentResponse({
    description:
      'El producto se marcó como REMOVED. La respuesta no tiene cuerpo.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador del producto no tiene formato UUID.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no es el vendedor y no tiene rol ADMIN ni MODERATOR.',
  })
  @ApiNotFoundResponse({
    description:
      'No existe un producto con ese identificador o ya fue eliminado.',
  })
  @ApiConflictResponse({
    description: 'El producto está reservado o vendido y no se puede eliminar.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al eliminar el producto.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.productService.remove(id, user.id, user.role);
  }

  @Post(':id/favorite')
  @Auth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Marcar / desmarcar favorito',
    description:
      'Requiere JWT. Alterna el favorito para el usuario autenticado y devuelve el nuevo estado.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description:
      'Identificador UUID del producto que se desea marcar o desmarcar.',
  })
  @ApiOkResponse({
    type: FavoriteResultDto,
    description: 'Se devuelve el nuevo estado del favorito.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador del producto no tiene formato UUID.',
  })
  @ApiNotFoundResponse({
    description: 'No existe un producto con ese identificador o fue eliminado.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al cambiar el estado del favorito.',
  })
  toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<FavoriteResultDto> {
    return this.productService.toggleFavorite(id, user.id);
  }
}

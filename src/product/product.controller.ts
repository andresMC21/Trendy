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
  @ApiOkResponse({ type: PaginatedProductsDto })
  @ApiBadRequestResponse({
    description: 'Filtros inválidos (p. ej. lat sin lng)',
  })
  findAll(@Query() query: FindProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de un producto',
    description: 'Público. Suma una visita.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'No existe o fue eliminado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Publicar un producto',
    description:
      'Requiere JWT. El vendedor se toma del usuario autenticado; el producto inicia en estado AVAILABLE. Si no se especifican price y acceptsBarter, se usan 0 y false.',
  })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiBadRequestResponse({ description: 'Body inválido' })
  create(@GetUser() user: User, @Body() dto: CreateProductDto) {
    return this.productService.create(user.id, dto);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({
    summary: 'Editar un producto',
    description:
      'Requiere JWT. Solo el vendedor puede editar el producto y únicamente mientras esté AVAILABLE.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductDto })
  @ApiBadRequestResponse({ description: 'El id o el cuerpo no es válido' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiForbiddenResponse({
    description: 'Solo el vendedor puede modificar el producto',
  })
  @ApiConflictResponse({
    description: 'El producto no está AVAILABLE',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() dto: UpdateProductDto,
  ) {
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
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Eliminado' })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiForbiddenResponse({
    description: 'Solo el vendedor o un ADMIN/MODERATOR pueden eliminarlo',
  })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({
    description: 'El producto está reservado o vendido',
  })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
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
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: FavoriteResultDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.productService.toggleFavorite(id, user.id);
  }
}

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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
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
  ProductImageDto,
} from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import {
  imageUploadOptions,
  MAX_IMAGES_PER_PRODUCT,
} from './storage/image-upload.options';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Feed de productos',
    description:
      'Público. Solo productos AVAILABLE. Filtra por barrio, cercanía (lat/lng/radius en km), categoría y condición.',
  })
  @ApiOkResponse({ type: PaginatedProductsDto })
  @ApiBadRequestResponse({ description: 'Filtros inválidos (p. ej. lat sin lng)' })
  findAll(@Query() query: FindProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un producto', description: 'Público. Suma una visita.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiNotFoundResponse({ description: 'No existe o fue eliminado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Publicar un producto' })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiBadRequestResponse({ description: 'Body inválido' })
  create(@GetUser() user: User, @Body() dto: CreateProductDto) {
    return this.productService.create(user.id, dto);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({
    summary: 'Editar un producto',
    description: 'Solo el vendedor y solo mientras esté AVAILABLE.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({ description: 'El producto no está AVAILABLE' })
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
    description: 'El vendedor, o un ADMIN/MODERATOR. Solo si está AVAILABLE.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Eliminado' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({ description: 'El producto está reservado o vendido' })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.productService.remove(id, user.id, user.role);
  }

  @Post(':id/images')
  @Auth()
  @UseInterceptors(FilesInterceptor('files', MAX_IMAGES_PER_PRODUCT, imageUploadOptions))
  @ApiOperation({
    summary: 'Subir imágenes del producto',
    description: `Hasta ${MAX_IMAGES_PER_PRODUCT} imágenes por producto, JPG/PNG/WEBP, máx. 5 MB c/u. Campo multipart: "files".`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: [ProductImageDto] })
  @ApiBadRequestResponse({ description: 'Archivo inválido o se excede el máximo' })
  addImages(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productService.addImages(id, user.id, files);
  }

  @Post(':id/favorite')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar / desmarcar favorito', description: 'Alterna el estado.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: FavoriteResultDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  toggleFavorite(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.productService.toggleFavorite(id, user.id);
  }
}

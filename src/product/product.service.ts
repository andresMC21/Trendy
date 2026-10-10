import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GeoPoint, toGeoJson } from './interfaces/geo.interface';
import { PaginatedResult } from './interfaces/paginated-result.interface';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import {
  ProductDetailDto,
  ProductDto,
  ProductImageDto,
} from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { ProductSort } from './enums/product-sort.enum';
import { ProductStatus } from './enums/product-status.enum';
import { MAX_IMAGES_PER_PRODUCT } from './storage/image-upload.options';
import { StorageService } from './storage/storage.service';

/** Transiciones de estado válidas (las usa TransactionService vía updateStatus). */
const ALLOWED_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.AVAILABLE]: [
    ProductStatus.RESERVED,
    ProductStatus.SOLD,
    ProductStatus.REMOVED,
  ],
  [ProductStatus.RESERVED]: [ProductStatus.AVAILABLE, ProductStatus.SOLD],
  [ProductStatus.SOLD]: [],
  [ProductStatus.REMOVED]: [],
};

const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  expiresAt: number;
  value: PaginatedResult<ProductDto>;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  /**
   * Caché del feed en memoria (clave -> resultado).
   * Misma interfaz que tendría Redis: buildFeedCacheKey / invalidateFeedCache.
   */
  private readonly feedCache = new Map<string, CacheEntry>();
  private readonly feedCacheTtlMs: number;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly storage: StorageService,
    config: ConfigService,
  ) {
    this.feedCacheTtlMs =
      Number(config.get<string>('FEED_CACHE_TTL_SECONDS') ?? 30) * 1000;
  }

  // ───────────────────────── Lectura ─────────────────────────

  /** GET /products — feed hiperlocal paginado (solo productos AVAILABLE). */
  async findAll(
    query: FindProductsQueryDto,
  ): Promise<PaginatedResult<ProductDto>> {
    const {
      neighborhood,
      lat,
      lng,
      radius = 5,
      category,
      condition,
      sort = ProductSort.RECENT,
      page = 1,
      limit = 20,
    } = query;

    if ((lat === undefined) !== (lng === undefined)) {
      throw new BadRequestException('lat y lng deben enviarse juntos');
    }
    const hasGeo = lat !== undefined && lng !== undefined;
    if (sort === ProductSort.DISTANCE && !hasGeo) {
      throw new BadRequestException('sort=distance requiere lat y lng');
    }

    const cacheKey = this.buildFeedCacheKey(query);
    const cached = this.feedCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.AVAILABLE });

    if (neighborhood) {
      qb.andWhere('product.neighborhoodId = :neighborhood', { neighborhood });
    }
    if (category) {
      qb.andWhere('LOWER(product.category) = LOWER(:category)', { category });
    }
    if (condition) {
      qb.andWhere('product.condition = :condition', { condition });
    }

    const point = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
    if (hasGeo) {
      qb.andWhere(`ST_DWithin(product.location, ${point}, :meters)`, {
        lng,
        lat,
        meters: radius * 1000,
      });
    }

    const total = await qb.getCount();

    if (hasGeo) {
      qb.addSelect(`ST_Distance(product.location, ${point})`, 'distance');
    }
    this.applySort(qb, sort);

    const { entities, raw } = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawAndEntities();

    await this.attachImages(entities);
    const counts = await this.countFavorites(entities.map((p) => p.id));

    const items = entities.map((product, i) =>
      ProductDto.fromEntity(product, {
        favoritesCount: counts.get(product.id) ?? 0,
        distanceKm: hasGeo
          ? Math.round((Number(raw[i].distance) / 1000) * 100) / 100
          : undefined,
      }),
    );

    const result: PaginatedResult<ProductDto> = { items, total, page, limit };
    this.storeInCache(cacheKey, result);
    return result;
  }

  /** GET /products/:id — detalle con vendedor. Suma una visita. */
  async findOne(id: string): Promise<ProductDetailDto> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoin('product.seller', 'seller')
      .addSelect([
        'seller.id',
        'seller.fullName',
        'seller.photoUrl',
        'seller.ratingAverage',
        'seller.reviewsCount',
      ])
      .where('product.id = :id', { id })
      .orderBy('images.position', 'ASC')
      .getOne();

    if (!product || product.status === ProductStatus.REMOVED) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    await this.productRepository.increment({ id }, 'viewsCount', 1);
    product.viewsCount += 1;

    const counts = await this.countFavorites([id]);
    const dto = ProductDto.fromEntity(product, {
      favoritesCount: counts.get(id) ?? 0,
    }) as ProductDetailDto;
    dto.seller = {
      id: product.seller.id,
      fullName: product.seller.fullName,
      photoUrl: product.seller.photoUrl ?? null,
      ratingAverage: product.seller.ratingAverage ?? 0,
      reviewsCount: product.seller.reviewsCount ?? 0,
    };
    return dto;
  }

  /** Uso interno (TransactionService): devuelve la entidad, incluso si está SOLD/REMOVED. */
  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  /** Consulta PostGIS (ST_DWithin) de productos disponibles cerca de un punto. */
  async findNearby(
    location: GeoPoint,
    radiusKm: number,
    limit = 50,
  ): Promise<Product[]> {
    const point = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.AVAILABLE })
      .andWhere(`ST_DWithin(product.location, ${point}, :meters)`, {
        lng: location.lng,
        lat: location.lat,
        meters: radiusKm * 1000,
      })
      .orderBy(`ST_Distance(product.location, ${point})`, 'ASC')
      .limit(limit)
      .getMany();
  }

  // ───────────────────────── Escritura ─────────────────────────

  /** POST /products */
  async create(sellerId: string, dto: CreateProductDto): Promise<ProductDto> {
    const { location, ...rest } = dto;
    const product = this.productRepository.create({
      ...rest,
      price: dto.price ?? 0,
      acceptsBarter: dto.acceptsBarter ?? false,
      estimatedWeightKg: dto.estimatedWeightKg ?? null,
      sellerId,
      status: ProductStatus.AVAILABLE,
      location: toGeoJson(location),
    });
    const saved = await this.productRepository.save(product);
    saved.images = [];
    await this.invalidateFeedCache(saved.neighborhoodId);
    return ProductDto.fromEntity(saved);
  }

  /** PUT /products/:id — solo el dueño y solo si está AVAILABLE. */
  async update(
    id: string,
    userId: string,
    dto: UpdateProductDto,
  ): Promise<ProductDto> {
    const product = await this.getActiveWithImages(id);
    this.assertOwnership(product, userId);
    if (product.status !== ProductStatus.AVAILABLE) {
      throw new ConflictException(
        `No se puede editar un producto en estado ${product.status}`,
      );
    }

    const previousNeighborhood = product.neighborhoodId;
    const { location, ...rest } = dto;
    Object.assign(product, rest);
    if (location) product.location = toGeoJson(location);

    // images tiene cascade; se detacha para no reescribirlas al guardar
    const images = product.images;
    delete (product as Partial<Product>).images;
    const saved = await this.productRepository.save(product);
    saved.images = images;

    await this.invalidateFeedCache(previousNeighborhood);
    if (saved.neighborhoodId !== previousNeighborhood) {
      await this.invalidateFeedCache(saved.neighborhoodId);
    }
    const counts = await this.countFavorites([id]);
    return ProductDto.fromEntity(saved, { favoritesCount: counts.get(id) ?? 0 });
  }

  /**
   * DELETE /products/:id — borrado lógico (status = REMOVED).
   * Lo puede hacer el dueño, o un ADMIN/MODERATOR (moderación).
   */
  async remove(
    id: string,
    userId: string,
    roles: ValidRoles[] = [],
  ): Promise<void> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product || product.status === ProductStatus.REMOVED) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    if (!this.canModerate(roles)) this.assertOwnership(product, userId);

    if (product.status !== ProductStatus.AVAILABLE) {
      throw new ConflictException(
        `No se puede eliminar un producto en estado ${product.status}`,
      );
    }
    await this.productRepository.update({ id }, { status: ProductStatus.REMOVED });
    await this.invalidateFeedCache(product.neighborhoodId);
  }

  /** POST /products/:id/images */
  async addImages(
    id: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImageDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes enviar al menos una imagen en el campo "files"');
    }
    const product = await this.getActiveWithImages(id);
    this.assertOwnership(product, userId);
    if (product.status !== ProductStatus.AVAILABLE) {
      throw new ConflictException(
        `No se pueden agregar imágenes a un producto en estado ${product.status}`,
      );
    }
    if (product.images.length + files.length > MAX_IMAGES_PER_PRODUCT) {
      throw new BadRequestException(
        `Un producto admite máximo ${MAX_IMAGES_PER_PRODUCT} imágenes (ya tiene ${product.images.length})`,
      );
    }

    const urls: string[] = [];
    try {
      for (const file of files) urls.push(await this.storage.saveProductImage(file));
      const nextPosition = product.images.length
        ? Math.max(...product.images.map((i) => i.position)) + 1
        : 0;
      const saved = await this.imageRepository.save(
        urls.map((url, i) =>
          this.imageRepository.create({ productId: id, url, position: nextPosition + i }),
        ),
      );
      await this.invalidateFeedCache(product.neighborhoodId);
      return saved.map(ProductImageDto.fromEntity);
    } catch (error) {
      // No dejar archivos huérfanos si algo falló a mitad de camino
      await Promise.all(urls.map((u) => this.storage.delete(u)));
      throw error;
    }
  }

  /** POST /products/:id/favorite — alterna favorito. */
  async toggleFavorite(
    id: string,
    userId: string,
  ): Promise<{ isFavorite: boolean }> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product || product.status === ProductStatus.REMOVED) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const already = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.favoritedBy', 'fan', 'fan.id = :userId', { userId })
      .where('product.id = :id', { id })
      .getCount();

    const relation = this.productRepository
      .createQueryBuilder()
      .relation(Product, 'favoritedBy')
      .of(id);

    if (already > 0) {
      await relation.remove(userId);
      return { isFavorite: false };
    }
    await relation.add(userId);
    return { isFavorite: true };
  }

  /** Lo usa TransactionService: reserva (RESERVED), venta (SOLD) o liberación (AVAILABLE). */
  async updateStatus(id: string, status: ProductStatus): Promise<void> {
    const product = await this.findById(id);
    if (product.status === status) return;

    if (!ALLOWED_STATUS_TRANSITIONS[product.status].includes(status)) {
      throw new ConflictException(
        `Transición de estado inválida: ${product.status} → ${status}`,
      );
    }
    await this.productRepository.update({ id }, { status });
    await this.invalidateFeedCache(product.neighborhoodId);
  }

  // ───────────────────────── Permisos ─────────────────────────

  assertOwnership(product: Product, userId: string): void {
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Solo el vendedor puede modificar este producto');
    }
  }

  private canModerate(roles: ValidRoles[]): boolean {
    return roles.includes(ValidRoles.ADMIN) || roles.includes(ValidRoles.MODERATOR);
  }

  // ───────────────────────── Caché del feed ─────────────────────────

  /** Clave: feed:<barrio|all>:<resto de filtros normalizados> */
  buildFeedCacheKey(query: FindProductsQueryDto): string {
    const q = {
      lat: query.lat ?? null,
      lng: query.lng ?? null,
      radius: query.radius ?? 5,
      category: query.category?.toLowerCase() ?? null,
      condition: query.condition ?? null,
      sort: query.sort ?? ProductSort.RECENT,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    return `feed:${query.neighborhood ?? 'all'}:${JSON.stringify(q)}`;
  }

  /**
   * Borra las entradas del barrio y las de consultas sin barrio ("all"),
   * porque estas últimas también pueden contener productos de ese barrio.
   */
  async invalidateFeedCache(neighborhoodId: string): Promise<void> {
    for (const key of this.feedCache.keys()) {
      if (key.startsWith(`feed:${neighborhoodId}:`) || key.startsWith('feed:all:')) {
        this.feedCache.delete(key);
      }
    }
  }

  private storeInCache(key: string, value: PaginatedResult<ProductDto>): void {
    if (this.feedCacheTtlMs <= 0) return;
    if (this.feedCache.size >= MAX_CACHE_ENTRIES) {
      const oldest = this.feedCache.keys().next().value;
      if (oldest !== undefined) this.feedCache.delete(oldest);
    }
    this.feedCache.set(key, { value, expiresAt: Date.now() + this.feedCacheTtlMs });
  }

  // ───────────────────────── Helpers ─────────────────────────

  private applySort(
    qb: ReturnType<Repository<Product>['createQueryBuilder']>,
    sort: ProductSort,
  ): void {
    switch (sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
        break;
      case ProductSort.POPULAR:
        qb.orderBy('product.viewsCount', 'DESC');
        break;
      case ProductSort.DISTANCE:
        qb.orderBy('distance', 'ASC');
        break;
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }
    qb.addOrderBy('product.id', 'ASC'); // desempate estable para paginar
  }

  private async getActiveWithImages(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { images: true },
      order: { images: { position: 'ASC' } },
    });
    if (!product || product.status === ProductStatus.REMOVED) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  private async attachImages(products: Product[]): Promise<void> {
    if (products.length === 0) return;
    const images = await this.imageRepository.find({
      where: { productId: In(products.map((p) => p.id)) },
      order: { position: 'ASC' },
    });
    for (const product of products) {
      product.images = images.filter((i) => i.productId === product.id);
    }
  }

  private async countFavorites(ids: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (ids.length === 0) return result;
    const rows = await this.productRepository
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .addSelect('COUNT(fan.id)', 'count')
      .leftJoin('product.favoritedBy', 'fan')
      .where('product.id IN (:...ids)', { ids })
      .groupBy('product.id')
      .getRawMany<{ id: string; count: string }>();
    for (const row of rows) result.set(row.id, Number(row.count));
    return result;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductCondition } from './enums/product-condition.enum';
import { ProductSort } from './enums/product-sort.enum';
import { ProductStatus } from './enums/product-status.enum';
import { ProductService } from './product.service';
import { StorageService } from './storage/storage.service';

/** QueryBuilder encadenable: cada método devuelve el mismo objeto. */
const makeQb = () => {
  const qb: any = {};
  [
    'where', 'andWhere', 'leftJoinAndSelect', 'leftJoin', 'innerJoin',
    'select', 'addSelect', 'orderBy', 'addOrderBy', 'offset', 'limit',
    'groupBy', 'relation', 'of',
  ].forEach((m) => (qb[m] = jest.fn().mockReturnValue(qb)));
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.getOne = jest.fn();
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawAndEntities = jest.fn().mockResolvedValue({ entities: [], raw: [] });
  qb.add = jest.fn().mockResolvedValue(undefined);
  qb.remove = jest.fn().mockResolvedValue(undefined);
  return qb;
};

const makeProduct = (over: Partial<Product> = {}): Product =>
  ({
    id: 'p1',
    sellerId: 'seller-1',
    title: 'Bici',
    description: 'desc',
    price: 100,
    acceptsBarter: false,
    category: 'deportes',
    condition: ProductCondition.USED,
    status: ProductStatus.AVAILABLE,
    location: { type: 'Point', coordinates: [-76.5, 3.4] },
    neighborhoodId: 'granada',
    estimatedWeightKg: 10,
    images: [],
    viewsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Product;

const file = (name = 'a.jpg') =>
  ({ originalname: name, buffer: Buffer.from([0xff, 0xd8, 0xff]) }) as Express.Multer.File;

describe('ProductService', () => {
  let service: ProductService;
  let qb: ReturnType<typeof makeQb>;
  const productRepo: any = {};
  const imageRepo: any = {};
  const storage = { saveProductImage: jest.fn(), delete: jest.fn() };

  const build = async (ttl = '30') => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductImage), useValue: imageRepo },
        { provide: StorageService, useValue: storage },
        { provide: ConfigService, useValue: { get: () => ttl } },
      ],
    }).compile();
    service = module.get(ProductService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = makeQb();
    Object.assign(productRepo, {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (x) => ({ id: 'p1', viewsCount: 0, createdAt: new Date(), updatedAt: new Date(), ...x })),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn().mockResolvedValue(undefined),
    });
    Object.assign(imageRepo, {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (list) => list.map((x: any, i: number) => ({ id: `img${i}`, ...x }))),
    });
    await build();
  });

  // ───────── create ─────────
  describe('create', () => {
    it('guarda con GeoJSON [lng, lat], valores por defecto y devuelve el DTO', async () => {
      // Arrange
      const dto = {
        title: 'Bici', description: 'd', category: 'deportes',
        condition: ProductCondition.USED, neighborhoodId: 'granada',
        location: { lat: 3.4, lng: -76.5 },
      };

      // Act
      const result = await service.create('seller-1', dto);

      // Assert
      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: 'seller-1',
          price: 0,
          acceptsBarter: false,
          estimatedWeightKg: null,
          status: ProductStatus.AVAILABLE,
          location: { type: 'Point', coordinates: [-76.5, 3.4] },
        }),
      );
      expect(result.location).toEqual({ lat: 3.4, lng: -76.5 });
      expect(result.images).toEqual([]);
    });

    it('invalida el caché del barrio', async () => {
      // Arrange
      const spy = jest.spyOn(service, 'invalidateFeedCache');

      // Act
      await service.create('s', {
        title: 'Bici', description: 'd', category: 'c', condition: ProductCondition.NEW,
        neighborhoodId: 'granada', location: { lat: 1, lng: 1 }, price: 5,
      });

      // Assert
      expect(spy).toHaveBeenCalledWith('granada');
    });
  });

  // ───────── findAll ─────────
  describe('findAll', () => {
    it('rechaza lat sin lng', async () => {
      // Arrange

      // Act

      // Assert
      await expect(service.findAll({ lat: 3 })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.findAll({ lng: 3 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza sort=distance sin coordenadas', async () => {
      // Arrange

      // Act

      // Assert
      await expect(service.findAll({ sort: ProductSort.DISTANCE })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('devuelve resultado paginado con imágenes y favoritos', async () => {
      // Arrange
      qb.getCount.mockResolvedValue(1);
      qb.getRawAndEntities.mockResolvedValue({ entities: [makeProduct()], raw: [{}] });
      imageRepo.find.mockResolvedValue([{ id: 'i1', productId: 'p1', url: '/u/1.jpg', position: 0 }]);
      qb.getRawMany.mockResolvedValue([{ id: 'p1', count: '3' }]);

      // Act
      const res = await service.findAll({ neighborhood: 'granada', category: 'Deportes', condition: ProductCondition.USED, page: 2, limit: 5 });

      // Assert
      expect(res).toMatchObject({ total: 1, page: 2, limit: 5 });
      expect(res.items[0].images).toHaveLength(1);
      expect(res.items[0].favoritesCount).toBe(3);
      expect(res.items[0].distanceKm).toBeUndefined();
      expect(qb.offset).toHaveBeenCalledWith(5);
      expect(qb.limit).toHaveBeenCalledWith(5);
    });

    it('con lat/lng filtra por ST_DWithin y devuelve distanceKm en km', async () => {
      // Arrange
      qb.getCount.mockResolvedValue(1);
      qb.getRawAndEntities.mockResolvedValue({ entities: [makeProduct()], raw: [{ distance: '1234.5' }] });

      // Act
      const res = await service.findAll({ lat: 3.4, lng: -76.5, radius: 2, sort: ProductSort.DISTANCE });

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        expect.objectContaining({ meters: 2000 }),
      );
      expect(qb.orderBy).toHaveBeenCalledWith('distance', 'ASC');
      expect(res.items[0].distanceKm).toBe(1.23);
    });

    it.each([
      [ProductSort.PRICE_ASC, 'product.price', 'ASC'],
      [ProductSort.PRICE_DESC, 'product.price', 'DESC'],
      [ProductSort.POPULAR, 'product.viewsCount', 'DESC'],
      [ProductSort.RECENT, 'product.createdAt', 'DESC'],
    ])('ordena por %s', async (sort, column, dir) => {
      // Arrange

      // Act
      await service.findAll({ sort });

      // Assert
      expect(qb.orderBy).toHaveBeenCalledWith(column, dir);
    });

    it('lista vacía no consulta imágenes ni favoritos', async () => {
      // Arrange

      // Act
      const res = await service.findAll({});

      // Assert
      expect(res.items).toEqual([]);
      expect(imageRepo.find).not.toHaveBeenCalled();
    });

    it('usa el caché en la segunda llamada y se vacía al invalidar', async () => {
      // Arrange

      // Act
      await service.findAll({ neighborhood: 'granada' });
      await service.findAll({ neighborhood: 'granada' });

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(1);

      await service.invalidateFeedCache('granada');
      await service.findAll({ neighborhood: 'granada' });
      expect(qb.getCount).toHaveBeenCalledTimes(2);
    });

    it('invalidar un barrio también limpia las consultas sin barrio, pero no las de otros barrios', async () => {
      // Arrange

      // Act
      await service.findAll({});
      await service.findAll({ neighborhood: 'centro' });
      await service.invalidateFeedCache('granada');
      await service.findAll({});
      await service.findAll({ neighborhood: 'centro' });

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(3); // all se recalcula, centro sigue en caché
    });

    it('con TTL 0 el caché queda deshabilitado', async () => {
      // Arrange
      await build('0');

      // Act
      await service.findAll({});
      await service.findAll({});

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(2);
    });

    it('descarta la entrada más antigua al llenar el caché', async () => {
      // Arrange

      // Act
      for (let i = 0; i < 502; i++) await service.findAll({ page: i + 1 });
      qb.getCount.mockClear();
      await service.findAll({ page: 1 }); // la primera ya fue expulsada

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('buildFeedCacheKey', () => {
    it('es estable ante mayúsculas y valores por defecto', () => {
      // Arrange

      // Act

      // Assert
      expect(service.buildFeedCacheKey({ category: 'Libros' })).toBe(
        service.buildFeedCacheKey({ category: 'libros', page: 1, limit: 20, radius: 5, sort: ProductSort.RECENT }),
      );
    });
    it('incluye el barrio en el prefijo', () => {
      // Arrange

      // Act

      // Assert
      expect(service.buildFeedCacheKey({ neighborhood: 'granada' })).toMatch(/^feed:granada:/);
      expect(service.buildFeedCacheKey({})).toMatch(/^feed:all:/);
    });
  });

  // ───────── findOne / findById / findNearby ─────────
  describe('findOne', () => {
    it('404 si no existe o fue eliminado', async () => {
      // Arrange
      qb.getOne.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
      qb.getOne.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('suma una visita y devuelve el vendedor sin datos sensibles', async () => {
      // Arrange
      qb.getOne.mockResolvedValue(
        makeProduct({ seller: { id: 'seller-1', fullName: 'Ana', photoUrl: undefined, ratingAverage: 4.5, reviewsCount: 2, password: 'hash', email: 'a@a.com' } as any }),
      );

      // Act
      const res = await service.findOne('p1');

      // Assert
      expect(productRepo.increment).toHaveBeenCalledWith({ id: 'p1' }, 'viewsCount', 1);
      expect(res.viewsCount).toBe(1);
      expect(res.seller).toEqual({ id: 'seller-1', fullName: 'Ana', photoUrl: null, ratingAverage: 4.5, reviewsCount: 2 });
    });

    it('usa 0 por defecto si el vendedor no tiene rating', async () => {
      // Arrange
      qb.getOne.mockResolvedValue(makeProduct({ seller: { id: 's', fullName: 'A' } as any }));

      // Act
      const res = await service.findOne('p1');

      // Assert
      expect(res.seller.ratingAverage).toBe(0);
      expect(res.seller.reviewsCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('devuelve la entidad', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act

      // Assert
      expect((await service.findById('p1')).id).toBe('p1');
    });
    it('404 si no existe', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findNearby', () => {
    it('consulta con ST_DWithin en metros', async () => {
      // Arrange
      qb.getMany.mockResolvedValue([makeProduct()]);

      // Act
      const res = await service.findNearby({ lat: 3.4, lng: -76.5 }, 3, 10);

      // Assert
      expect(res).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('ST_DWithin'), expect.objectContaining({ meters: 3000 }));
      expect(qb.limit).toHaveBeenCalledWith(10);
    });
  });

  // ───────── update ─────────
  describe('update', () => {
    it('404 si no existe', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.update('x', 'u', {})).rejects.toBeInstanceOf(NotFoundException);
    });
    it('403 si no es el dueño', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct());

      // Act

      // Assert
      await expect(service.update('p1', 'otro', {})).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('409 si no está AVAILABLE', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct({ status: ProductStatus.RESERVED }));

      // Act

      // Assert
      await expect(service.update('p1', 'seller-1', {})).rejects.toBeInstanceOf(ConflictException);
    });
    it('actualiza campos y ubicación, conserva imágenes', async () => {
      // Arrange
      const img = { id: 'i', productId: 'p1', url: 'u', position: 0 } as ProductImage;
      productRepo.findOne.mockResolvedValue(makeProduct({ images: [img] }));

      // Act
      const res = await service.update('p1', 'seller-1', { price: 50, location: { lat: 1, lng: 2 } });
      const saved = productRepo.save.mock.calls[0][0];

      // Assert
      expect(saved.price).toBe(50);
      expect(saved.location).toEqual({ type: 'Point', coordinates: [2, 1] });
      expect(saved.images).toBeUndefined();
      expect(res.images).toHaveLength(1);
      expect(res.location).toEqual({ lat: 1, lng: 2 });
    });
    it('invalida ambos barrios si cambia de barrio', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct());
      const spy = jest.spyOn(service, 'invalidateFeedCache');

      // Act
      await service.update('p1', 'seller-1', { neighborhoodId: 'centro' });

      // Assert
      expect(spy).toHaveBeenCalledWith('granada');
      expect(spy).toHaveBeenCalledWith('centro');
    });
  });

  // ───────── remove ─────────
  describe('remove', () => {
    it('404 si no existe o ya está eliminado', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.remove('x', 'u')).rejects.toBeInstanceOf(NotFoundException);
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.remove('p1', 'seller-1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('403 si no es el dueño ni moderador', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act

      // Assert
      await expect(service.remove('p1', 'otro', [ValidRoles.USER])).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('409 si está reservado o vendido', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.RESERVED }));

      // Act

      // Assert
      await expect(service.remove('p1', 'seller-1')).rejects.toBeInstanceOf(ConflictException);
    });
    it('borrado lógico por el dueño', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      await service.remove('p1', 'seller-1');

      // Assert
      expect(productRepo.update).toHaveBeenCalledWith({ id: 'p1' }, { status: ProductStatus.REMOVED });
    });
    it.each([ValidRoles.ADMIN, ValidRoles.MODERATOR])('%s puede eliminar productos ajenos', async (role) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      await service.remove('p1', 'otro', [role]);

      // Assert
      expect(productRepo.update).toHaveBeenCalled();
    });
  });

  // ───────── addImages ─────────
  describe('addImages', () => {
    const owned = (images: Partial<ProductImage>[] = []) =>
      productRepo.findOne.mockResolvedValue(makeProduct({ images: images as ProductImage[] }));

    it('400 sin archivos', async () => {
      // Arrange

      // Act

      // Assert
      await expect(service.addImages('p1', 'seller-1', [])).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.addImages('p1', 'seller-1', undefined as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('403 si no es el dueño', async () => {
      // Arrange
      owned();

      // Act

      // Assert
      await expect(service.addImages('p1', 'otro', [file()])).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('409 si no está AVAILABLE', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct({ status: ProductStatus.SOLD }));

      // Act

      // Assert
      await expect(service.addImages('p1', 'seller-1', [file()])).rejects.toBeInstanceOf(ConflictException);
    });
    it('400 si supera el máximo de imágenes', async () => {
      // Arrange
      owned(Array.from({ length: 8 }, (_, i) => ({ position: i })));

      // Act

      // Assert
      await expect(service.addImages('p1', 'seller-1', [file()])).rejects.toBeInstanceOf(BadRequestException);
    });
    it('guarda las imágenes con posiciones consecutivas', async () => {
      // Arrange
      owned([{ position: 0 }, { position: 4 }]);
      storage.saveProductImage.mockResolvedValueOnce('/uploads/products/a.jpg').mockResolvedValueOnce('/uploads/products/b.jpg');

      // Act
      const res = await service.addImages('p1', 'seller-1', [file('a.jpg'), file('b.jpg')]);

      // Assert
      expect(res.map((i) => i.position)).toEqual([5, 6]);
      expect(res.map((i) => i.url)).toEqual(['/uploads/products/a.jpg', '/uploads/products/b.jpg']);
    });
    it('empieza en la posición 0 si no hay imágenes', async () => {
      // Arrange
      owned();
      storage.saveProductImage.mockResolvedValue('/uploads/products/a.jpg');

      // Act
      const res = await service.addImages('p1', 'seller-1', [file()]);

      // Assert
      expect(res[0].position).toBe(0);
    });
    it('borra los archivos ya guardados si falla la operación', async () => {
      // Arrange
      owned();
      storage.saveProductImage.mockResolvedValueOnce('/uploads/products/a.jpg').mockRejectedValueOnce(new BadRequestException('mala'));

      // Act

      // Assert
      await expect(service.addImages('p1', 'seller-1', [file(), file()])).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.delete).toHaveBeenCalledWith('/uploads/products/a.jpg');
    });
  });

  // ───────── favoritos ─────────
  describe('toggleFavorite', () => {
    it('404 si no existe o fue eliminado', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.toggleFavorite('x', 'u')).rejects.toBeInstanceOf(NotFoundException);
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.toggleFavorite('p1', 'u')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('agrega si no era favorito', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());
      qb.getCount.mockResolvedValue(0);

      // Act

      // Assert
      expect(await service.toggleFavorite('p1', 'u1')).toEqual({ isFavorite: true });
      expect(qb.add).toHaveBeenCalledWith('u1');
    });
    it('quita si ya era favorito', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());
      qb.getCount.mockResolvedValue(1);

      // Act

      // Assert
      expect(await service.toggleFavorite('p1', 'u1')).toEqual({ isFavorite: false });
      expect(qb.remove).toHaveBeenCalledWith('u1');
    });
  });

  // ───────── updateStatus ─────────
  describe('updateStatus', () => {
    it('404 si no existe', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.updateStatus('x', ProductStatus.RESERVED)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('no hace nada si el estado ya es el pedido', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      await service.updateStatus('p1', ProductStatus.AVAILABLE);

      // Assert
      expect(productRepo.update).not.toHaveBeenCalled();
    });
    it.each([
      [ProductStatus.AVAILABLE, ProductStatus.RESERVED],
      [ProductStatus.AVAILABLE, ProductStatus.SOLD],
      [ProductStatus.RESERVED, ProductStatus.AVAILABLE],
      [ProductStatus.RESERVED, ProductStatus.SOLD],
    ])('permite %s → %s', async (from, to) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: from }));

      // Act
      await service.updateStatus('p1', to);

      // Assert
      expect(productRepo.update).toHaveBeenCalledWith({ id: 'p1' }, { status: to });
    });
    it.each([
      [ProductStatus.SOLD, ProductStatus.AVAILABLE],
      [ProductStatus.REMOVED, ProductStatus.RESERVED],
      [ProductStatus.RESERVED, ProductStatus.REMOVED],
    ])('rechaza %s → %s', async (from, to) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: from }));

      // Act

      // Assert
      await expect(service.updateStatus('p1', to)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('assertOwnership', () => {
    it('no lanza para el dueño y lanza 403 para otro', () => {
      // Arrange

      // Act

      // Assert
      expect(() => service.assertOwnership(makeProduct(), 'seller-1')).not.toThrow();
      expect(() => service.assertOwnership(makeProduct(), 'otro')).toThrow(ForbiddenException);
    });
  });
});

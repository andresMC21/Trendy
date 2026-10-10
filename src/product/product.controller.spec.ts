import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { User } from '../user/entities/user.entity';

describe('ProductController', () => {
  let controller: ProductController;
  const service = {
    findAll: jest.fn().mockResolvedValue('list'),
    findOne: jest.fn().mockResolvedValue('detail'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue(undefined),
    addImages: jest.fn().mockResolvedValue('images'),
    toggleFavorite: jest.fn().mockResolvedValue({ isFavorite: true }),
  };
  const user = { id: 'u1', role: [ValidRoles.USER] } as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: service }],
    }).compile();
    controller = module.get(ProductController);
  });

  it('findAll delega el query', async () => {
    // Arrange
    const query = { page: 2 };

    // Act
    const result = await controller.findAll(query);

    // Assert
    expect(result).toBe('list');
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne delega el id', async () => {
    // Arrange
    const productId = 'p1';

    // Act
    const result = await controller.findOne(productId);

    // Assert
    expect(result).toBe('detail');
    expect(service.findOne).toHaveBeenCalledWith(productId);
  });

  it('create usa el id del usuario autenticado', async () => {
    // Arrange
    const dto: any = { title: 'x' };

    // Act
    const result = await controller.create(user, dto);

    // Assert
    expect(result).toBe('created');
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('update pasa id, usuario y dto', async () => {
    // Arrange
    const dto = { price: 1 };

    // Act
    await controller.update('p1', user, dto);

    // Assert
    expect(service.update).toHaveBeenCalledWith('p1', 'u1', dto);
  });

  it('remove pasa los roles del usuario (moderación)', async () => {
    // Arrange
    const productId = 'p1';

    // Act
    await controller.remove(productId, user);

    // Assert
    expect(service.remove).toHaveBeenCalledWith(productId, 'u1', [ValidRoles.USER]);
  });

  it('addImages pasa los archivos', async () => {
    // Arrange
    const files = [{}] as Express.Multer.File[];

    // Act
    const result = await controller.addImages('p1', user, files);

    // Assert
    expect(result).toBe('images');
    expect(service.addImages).toHaveBeenCalledWith('p1', 'u1', files);
  });

  it('toggleFavorite', async () => {
    // Arrange
    const productId = 'p1';

    // Act
    const result = await controller.toggleFavorite(productId, user);

    // Assert
    expect(result).toEqual({ isFavorite: true });
    expect(service.toggleFavorite).toHaveBeenCalledWith(productId, 'u1');
  });
});

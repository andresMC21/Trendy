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
    expect(await controller.findAll({ page: 2 })).toBe('list');
    expect(service.findAll).toHaveBeenCalledWith({ page: 2 });
  });

  it('findOne delega el id', async () => {
    expect(await controller.findOne('p1')).toBe('detail');
    expect(service.findOne).toHaveBeenCalledWith('p1');
  });

  it('create usa el id del usuario autenticado', async () => {
    const dto: any = { title: 'x' };
    expect(await controller.create(user, dto)).toBe('created');
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('update pasa id, usuario y dto', async () => {
    await controller.update('p1', user, { price: 1 });
    expect(service.update).toHaveBeenCalledWith('p1', 'u1', { price: 1 });
  });

  it('remove pasa los roles del usuario (moderación)', async () => {
    await controller.remove('p1', user);
    expect(service.remove).toHaveBeenCalledWith('p1', 'u1', [ValidRoles.USER]);
  });

  it('addImages pasa los archivos', async () => {
    const files = [{}] as Express.Multer.File[];
    expect(await controller.addImages('p1', user, files)).toBe('images');
    expect(service.addImages).toHaveBeenCalledWith('p1', 'u1', files);
  });

  it('toggleFavorite', async () => {
    expect(await controller.toggleFavorite('p1', user)).toEqual({ isFavorite: true });
    expect(service.toggleFavorite).toHaveBeenCalledWith('p1', 'u1');
  });
});

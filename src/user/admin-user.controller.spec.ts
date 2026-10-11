import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from './admin-user.controller';
import { ValidRoles } from './enums/valid-roles.enum';
import { UserService } from './user.service';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  const userService = {
    findAll: jest.fn(),
    findOneAdmin: jest.fn(),
    adminUpdate: jest.fn(),
    changeRoles: jest.fn(),
    setActiveStatus: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [AdminUserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get(AdminUserController);
  });

  it('findAll y findOne delegan al servicio', async () => {
    // Arrange
    const query = { limit: 10, skip: 0 };
    userService.findAll.mockResolvedValue('list');
    userService.findOneAdmin.mockResolvedValue('detail');

    // Act
    const list = await controller.findAll(query);
    const detail = await controller.findOne('u1');

    // Assert
    expect(list).toBe('list');
    expect(detail).toBe('detail');
    expect(userService.findAll).toHaveBeenCalledWith(query);
    expect(userService.findOneAdmin).toHaveBeenCalledWith('u1');
  });

  it('update, changeRoles, setActiveStatus y remove delegan argumentos completos', async () => {
    // Arrange
    const admin = { id: 'admin-1', role: [ValidRoles.ADMIN] } as any;
    const updateDto = { info: 'bio' };
    const roleDto = { roles: [ValidRoles.MODERATOR] };
    const activeDto = { isActive: false };
    userService.adminUpdate.mockResolvedValue('updated');
    userService.changeRoles.mockResolvedValue('roles');
    userService.setActiveStatus.mockResolvedValue('active');
    userService.remove.mockResolvedValue('removed');

    // Act
    const updated = await controller.update('u1', updateDto);
    const roles = await controller.changeRoles(admin, 'u1', roleDto);
    const active = await controller.setActiveStatus(admin, 'u1', activeDto);
    const removed = await controller.remove(admin, 'u1');

    // Assert
    expect(updated).toBe('updated');
    expect(roles).toBe('roles');
    expect(active).toBe('active');
    expect(removed).toBe('removed');
    expect(userService.adminUpdate).toHaveBeenCalledWith('u1', updateDto);
    expect(userService.changeRoles).toHaveBeenCalledWith(admin, 'u1', roleDto);
    expect(userService.setActiveStatus).toHaveBeenCalledWith(
      admin,
      'u1',
      activeDto,
    );
    expect(userService.remove).toHaveBeenCalledWith(admin, 'u1');
  });
});

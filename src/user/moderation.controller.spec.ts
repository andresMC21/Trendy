import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ModerationController } from './moderation.controller';
import { UserService } from './user.service';

describe('ModerationController', () => {
  let controller: ModerationController;
  const userService = {
    findPendingVerifications: jest.fn(),
    resolveVerification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ModerationController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get(ModerationController);
  });

  it('findPending delega la paginacion', async () => {
    // Arrange
    const pagination = { limit: 20, skip: 0 };
    userService.findPendingVerifications.mockResolvedValue('pending');

    // Act
    const result = await controller.findPending(pagination);

    // Assert
    expect(result).toBe('pending');
    expect(userService.findPendingVerifications).toHaveBeenCalledWith(
      pagination,
    );
  });

  it('resolve delega moderador, usuario objetivo y decision', async () => {
    // Arrange
    const moderator = { id: 'mod-1' } as any;
    const dto = { approved: false, reason: 'documento ilegible' };
    userService.resolveVerification.mockResolvedValue('resolved');

    // Act
    const result = await controller.resolve(moderator, 'u1', dto);

    // Assert
    expect(result).toBe('resolved');
    expect(userService.resolveVerification).toHaveBeenCalledWith(
      moderator,
      'u1',
      dto,
    );
  });
});

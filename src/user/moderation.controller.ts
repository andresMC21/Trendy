import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { PaginationDto } from './dto/pagination.dto';
import { ResolveVerification } from './dto/verification.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { UserService } from './user.service';

@ApiTags('Moderation')
@Controller('moderation/verifications')
export class ModerationController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @Auth(ValidRoles.MODERATOR, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Usuarios con verificación pendiente (más antiguos primero)' })
  findPending(@Query() pagination: PaginationDto) {
    return this.userService.findPendingVerifications(pagination);
  }

  @Patch(':userId')
  @Auth(ValidRoles.MODERATOR, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Aprobar o rechazar una verificación pendiente' })
  resolve(
    @GetUser() moderator: User,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ResolveVerification,
  ) {
    return this.userService.resolveVerification(moderator, userId, dto);
  }
}

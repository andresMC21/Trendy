import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { PaginationDto } from './dto/pagination.dto';
import { ResolveVerification } from './dto/verification.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { UserProfileDto } from './dto/profile.dto';
import { UserService } from './user.service';

@ApiTags('Moderation')
@Controller('moderation/verifications')
export class ModerationController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth(ValidRoles.MODERATOR, ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Listar solicitudes de verificación pendientes',
    description:
      'ADMIN y MODERATOR pueden consultar solicitudes PENDING. Devuelve primero las solicitudes más antiguas; limit y skip controlan la paginación.',
  })
  @ApiOkResponse({ type: PaginatedUsersDto })
  @ApiBadRequestResponse({
    description: 'Los parámetros de paginación no son válidos',
  })
  findPending(@Query() pagination: PaginationDto) {
    return this.userService.findPendingVerifications(pagination);
  }

  @Patch(':userId')
  @Auth(ValidRoles.MODERATOR, ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Resolver una solicitud de verificación',
    description:
      'ADMIN y MODERATOR pueden aprobarla (approved=true) o rechazarla (false). reason es opcional, se incluye en los logs y no queda almacenado en el perfil. No se puede resolver la propia solicitud.',
  })
  @ApiParam({
    name: 'userId',
    format: 'uuid',
    description: 'Id del usuario solicitante',
  })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({
    description: 'El id o el cuerpo de la solicitud es inválido',
  })
  @ApiForbiddenResponse({
    description: 'No se puede revisar la propia solicitud',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({
    description: 'El usuario no tiene una verificación pendiente',
  })
  resolve(
    @GetUser() moderator: User,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ResolveVerification,
  ) {
    return this.userService.resolveVerification(moderator, userId, dto);
  }
}

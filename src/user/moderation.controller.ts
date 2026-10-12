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
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 100,
    description:
      'Cantidad de solicitudes por página (de 1 a 100; predeterminado: 20).',
  })
  @ApiQuery({
    name: 'skip',
    type: Number,
    required: false,
    example: 0,
    description:
      'Cantidad de solicitudes que se omiten antes de iniciar la página.',
  })
  @ApiOkResponse({
    type: PaginatedUsersDto,
    description:
      'Se devuelve la página de solicitudes pendientes en orden de antigüedad.',
  })
  @ApiBadRequestResponse({
    description: 'Los parámetros de paginación no son válidos',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al listar las solicitudes pendientes.',
  })
  findPending(@Query() pagination: PaginationDto): Promise<PaginatedUsersDto> {
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
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del usuario solicitante.',
  })
  @ApiBody({
    type: ResolveVerification,
    description:
      'Decisión de aprobación o rechazo y, opcionalmente, su motivo.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description:
      'La solicitud se resolvió y se devuelve el perfil actualizado.',
  })
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
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al resolver la solicitud de verificación.',
  })
  resolve(
    @GetUser() moderator: User,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ResolveVerification,
  ): Promise<UserProfileDto> {
    return this.userService.resolveVerification(moderator, userId, dto);
  }
}

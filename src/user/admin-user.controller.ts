import {
  Body,
  Controller,
  Delete,
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
import { SetActiveStatus } from './dto/activeStatus.dto';
import { AdminUpdateUserDto } from './dto/adminUpdate.dto';
import { AdminUserQueryDto } from './dto/adminQuery.dto';
import { ChangeRole } from './dto/changeRole.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserProfileDto } from './dto/profile.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { VerificationStatus } from './enums/verification-status';
import { UserService } from './user.service';

// Se aplica @Auth() por método (no a nivel de clase) para no ejecutar los
// guards dos veces y poder dar solo lectura al moderador.
@ApiTags('Admin - Users')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.MODERATOR)
  @ApiOperation({
    summary: 'Listar usuarios para administración',
    description:
      'ADMIN y MODERATOR pueden consultar usuarios activos e inactivos. Permite filtrar por rol, estado activo, estado de verificación y búsqueda parcial por nombre o correo.',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 5,
    description:
      'Cantidad de usuarios por página (de 1 a 100; predeterminado: 20).',
  })
  @ApiQuery({
    name: 'skip',
    type: Number,
    required: false,
    example: 0,
    description:
      'Cantidad de usuarios que se omiten antes de iniciar la página.',
  })
  @ApiQuery({
    name: 'role',
    type: String,
    enum: ValidRoles,
    required: false,
    example: ValidRoles.ADMIN,
    description: 'Filtra por rol.',
  })
  @ApiQuery({
    name: 'isActive',
    type: Boolean,
    required: false,
    description: 'Filtra por estado activo (true) o inactivo (false).',
  })
  @ApiQuery({
    name: 'verificationStatus',
    type: String,
    enum: VerificationStatus,
    required: false,
    example: VerificationStatus.PENDING,
    description: 'Filtra por estado de verificación.',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    maxLength: 100,
    description: 'Coincidencia parcial por correo electrónico o nombre.',
  })
  @ApiOkResponse({
    type: PaginatedUsersDto,
    description:
      'Se devuelve la página de usuarios y el total que coincide con los filtros.',
  })
  @ApiBadRequestResponse({
    description: 'Uno o más filtros o parámetros de paginación no son válidos',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al listar los usuarios.',
  })
  findAll(@Query() query: AdminUserQueryDto): Promise<PaginatedUsersDto> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.MODERATOR)
  @ApiOperation({
    summary: 'Consultar un usuario para administración',
    description:
      'ADMIN y MODERATOR pueden consultar el perfil aunque la cuenta esté inactiva.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del usuario.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'Se devuelve el perfil del usuario solicitado.',
  })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar el usuario.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfileDto> {
    return this.userService.findOneAdmin(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Editar los datos de perfil de un usuario',
    description:
      'Solo ADMIN. Permite modificar fullName, email e info; roles, estado activo y verificación tienen operaciones independientes.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del usuario.',
  })
  @ApiBody({
    type: AdminUpdateUserDto,
    description: 'Campos de perfil que el administrador desea actualizar.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'El perfil se actualizó correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'El id o el cuerpo de la solicitud es inválido',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al actualizar el perfil del usuario.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.userService.adminUpdate(id, dto);
  }

  @Patch(':id/role')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Reemplazar los roles de un usuario',
    description:
      'Solo ADMIN. roles debe contener al menos un rol válido y sin duplicados. Un administrador no puede quitarse a sí mismo el rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del usuario.',
  })
  @ApiBody({
    type: ChangeRole,
    description: 'Lista completa de roles que reemplazarán los actuales.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description:
      'Los roles se reemplazaron y se devuelve el perfil actualizado.',
  })
  @ApiBadRequestResponse({ description: 'El id o los roles son inválidos' })
  @ApiForbiddenResponse({
    description: 'No es posible quitarse el propio rol ADMIN',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al cambiar los roles del usuario.',
  })
  changeRoles(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRole,
  ): Promise<UserProfileDto> {
    return this.userService.changeRoles(admin, id, dto);
  }

  @Patch(':id/active')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Activar o desactivar una cuenta',
    description:
      'Solo ADMIN. isActive=true reactiva la cuenta; false la desactiva. El administrador no puede desactivar su propia cuenta.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del usuario.',
  })
  @ApiBody({
    type: SetActiveStatus,
    description: 'Nuevo estado de actividad de la cuenta.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'El estado de la cuenta se actualizó correctamente.',
  })
  @ApiBadRequestResponse({ description: 'El id o isActive son inválidos' })
  @ApiForbiddenResponse({
    description: 'No es posible desactivar la propia cuenta',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al cambiar el estado de la cuenta.',
  })
  setActiveStatus(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveStatus,
  ): Promise<UserProfileDto> {
    return this.userService.setActiveStatus(admin, id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Desactivar un usuario (borrado lógico)',
    description:
      'Solo ADMIN. Equivale a isActive=false y conserva el registro y las transacciones asociadas.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID del usuario.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'La cuenta se desactivó y se devuelve el perfil actualizado.',
  })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiForbiddenResponse({
    description: 'No es posible desactivar la propia cuenta',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al desactivar el usuario.',
  })
  remove(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserProfileDto> {
    return this.userService.remove(admin, id);
  }
}

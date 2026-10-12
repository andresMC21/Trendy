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
import { SetActiveStatus } from './dto/activeStatus.dto';
import { AdminUpdateUserDto } from './dto/adminUpdate.dto';
import { AdminUserQueryDto } from './dto/adminQuery.dto';
import { ChangeRole } from './dto/changeRole.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserProfileDto } from './dto/profile.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
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
  @ApiOkResponse({ type: PaginatedUsersDto })
  @ApiBadRequestResponse({
    description: 'Uno o más filtros o parámetros de paginación no son válidos',
  })
  findAll(@Query() query: AdminUserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.MODERATOR)
  @ApiOperation({
    summary: 'Consultar un usuario para administración',
    description:
      'ADMIN y MODERATOR pueden consultar el perfil aunque la cuenta esté inactiva.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del usuario' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOneAdmin(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Editar los datos de perfil de un usuario',
    description:
      'Solo ADMIN. Permite modificar fullName, email, photoUrl e info; roles, estado activo y verificación tienen operaciones independientes.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del usuario' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({
    description: 'El id o el cuerpo de la solicitud es inválido',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.userService.adminUpdate(id, dto);
  }

  @Patch(':id/role')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Reemplazar los roles de un usuario',
    description:
      'Solo ADMIN. roles debe contener al menos un rol válido y sin duplicados. Un administrador no puede quitarse a sí mismo el rol ADMIN.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del usuario' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({ description: 'El id o los roles son inválidos' })
  @ApiForbiddenResponse({
    description: 'No es posible quitarse el propio rol ADMIN',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  changeRoles(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRole,
  ) {
    return this.userService.changeRoles(admin, id, dto);
  }

  @Patch(':id/active')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Activar o desactivar una cuenta',
    description:
      'Solo ADMIN. isActive=true reactiva la cuenta; false la desactiva. El administrador no puede desactivar su propia cuenta.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del usuario' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({ description: 'El id o isActive son inválidos' })
  @ApiForbiddenResponse({
    description: 'No es posible desactivar la propia cuenta',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  setActiveStatus(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveStatus,
  ) {
    return this.userService.setActiveStatus(admin, id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({
    summary: 'Desactivar un usuario (borrado lógico)',
    description:
      'Solo ADMIN. Equivale a isActive=false y conserva el registro y las transacciones asociadas.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del usuario' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiForbiddenResponse({
    description: 'No es posible desactivar la propia cuenta',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  remove(@GetUser() admin: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(admin, id);
  }
}

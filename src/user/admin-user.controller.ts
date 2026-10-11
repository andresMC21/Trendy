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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { SetActiveStatus } from './dto/activeStatus.dto';
import { AdminUpdateUserDto } from './dto/adminUpdate.dto';
import { AdminUserQueryDto } from './dto/adminQuery.dto';
import { ChangeRole } from './dto/changeRole.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { UserService } from './user.service';

// Se aplica @Auth() por método (no a nivel de clase) para no ejecutar los
// guards dos veces y poder dar solo lectura al moderador.
@ApiTags('Admin - Users')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.MODERATOR)
  @ApiOperation({ summary: 'Listar usuarios (paginado, con filtros)' })
  findAll(@Query() query: AdminUserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.MODERATOR)
  @ApiOperation({ summary: 'Ver un usuario (incluye inactivos)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOneAdmin(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Editar fullName, email, photoUrl e info de un usuario' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.userService.adminUpdate(id, dto);
  }

  @Patch(':id/role')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Cambiar los roles de un usuario' })
  changeRoles(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRole,
  ) {
    return this.userService.changeRoles(admin, id, dto);
  }

  @Patch(':id/active')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Activar o desactivar un usuario' })
  setActiveStatus(
    @GetUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveStatus,
  ) {
    return this.userService.setActiveStatus(admin, id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete: isActive = false)' })
  remove(@GetUser() admin: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(admin, id);
  }
}

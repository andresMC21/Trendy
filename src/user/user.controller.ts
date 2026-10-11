import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // TODO(Camilo): endpoints temporales de register/login para poder probar
  // los demas modulos. Reemplazar por los definitivos del modulo 1.
  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario (temporal, modulo 1)' })
  register(@Body() dto: RegisterUserDto) {
    return this.userService.create(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion (temporal, modulo 1)' })
  login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }

  // Las rutas /me van antes de /:id para que ':id' no las capture.

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  findMe(@GetUser() user: User) {
    return this.userService.findMe(user);
  }

  @Patch('me')
  @Auth()
  @ApiOperation({
    summary:
      'Editar fullName, photoUrl e info (fullName bloqueado si esta verificado o en revision)',
  })
  updateMe(@GetUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user, dto);
  }

  @Patch('me/password')
  @Auth()
  @ApiOperation({
    summary: 'Cambiar contrasena (requiere la contrasena actual)',
  })
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user, dto);
  }

  @Patch('me/email')
  @Auth()
  @ApiOperation({ summary: 'Cambiar email (requiere la contrasena actual)' })
  changeEmail(@GetUser() user: User, @Body() dto: ChangeEmailDto) {
    return this.userService.changeEmail(user, dto);
  }

  @Post('me/verification')
  @Auth()
  @ApiOperation({
    summary: 'Solicitar verificacion de identidad (estado PENDING)',
  })
  requestVerification(@GetUser() user: User) {
    return this.userService.requestVerification(user);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Perfil de un usuario activo' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findPublicProfile(id);
  }
}

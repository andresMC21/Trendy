import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import {
  LoginResponseDto,
  MessageResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';
import { LoginUserDto } from './dto/login.dto';
import { UserProfileDto } from './dto/profile.dto';
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
  @ApiOperation({
    summary: 'Registrar una cuenta',
    description:
      'Normaliza el correo, crea una cuenta USER activa con verificación UNVERIFIED y devuelve el perfil junto con un JWT.',
  })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({
    description:
      'El correo, la contraseña o el nombre no cumplen las reglas de validación',
  })
  @ApiConflictResponse({ description: 'Ya existe una cuenta con ese correo' })
  register(@Body() dto: RegisterUserDto) {
    return this.userService.create(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Devuelve un JWT si el correo existe, la contraseña coincide y la cuenta está activa.',
  })
  @ApiCreatedResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'El correo o la contraseña tienen un formato inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales incorrectas o cuenta inactiva',
  })
  login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }

  // Las rutas /me van antes de /:id para que ':id' no las capture.

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  @ApiOkResponse({ type: UserProfileDto })
  findMe(@GetUser() user: User) {
    return this.userService.findMe(user);
  }

  @Patch('me')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar el perfil propio',
    description:
      'Permite cambiar fullName, photoUrl e info. fullName no se puede cambiar mientras la verificación esté PENDING o VERIFIED.',
  })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({ description: 'El cuerpo del perfil no es válido' })
  @ApiForbiddenResponse({
    description:
      'No se puede cambiar fullName en el estado de verificación actual',
  })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  updateMe(@GetUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user, dto);
  }

  @Patch('me/password')
  @Auth()
  @ApiOperation({
    summary: 'Cambiar la contraseña',
    description:
      'Requiere la contraseña actual. La nueva contraseña debe tener entre 8 y 12 caracteres y ser distinta a la actual.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({
    description:
      'La nueva contraseña no cumple las reglas o es igual a la actual',
  })
  @ApiForbiddenResponse({ description: 'La contraseña actual es incorrecta' })
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user, dto);
  }

  @Patch('me/email')
  @Auth()
  @ApiOperation({
    summary: 'Cambiar el correo electrónico',
    description:
      'Requiere la contraseña actual. El nuevo correo se normaliza a minúsculas y se eliminan espacios externos.',
  })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({
    description: 'El correo no es válido o coincide con el actual',
  })
  @ApiForbiddenResponse({ description: 'La contraseña actual es incorrecta' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  changeEmail(@GetUser() user: User, @Body() dto: ChangeEmailDto) {
    return this.userService.changeEmail(user, dto);
  }

  @Post('me/verification')
  @Auth()
  @ApiOperation({
    summary: 'Solicitar verificación de identidad',
    description:
      'Cambia verificationStatus a PENDING. No acepta una nueva solicitud si la cuenta ya está PENDING o VERIFIED.',
  })
  @ApiCreatedResponse({ type: UserProfileDto })
  @ApiConflictResponse({
    description: 'La identidad ya está verificada o en revisión',
  })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  requestVerification(@GetUser() user: User) {
    return this.userService.requestVerification(user);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Consultar el perfil de un usuario activo',
    description:
      'Requiere JWT; los usuarios inactivos no se exponen en este endpoint.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del usuario' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Usuario inexistente o inactivo' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findPublicProfile(id);
  }
}

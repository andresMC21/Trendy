import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
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
  constructor(private readonly userService: UserService) { }

  // TODO(Camilo): endpoints temporales de register/login para poder probar
  // los demas modulos. Reemplazar por los definitivos del modulo 1.
  @Post('register')
  @ApiOperation({
    summary: 'Registrar una cuenta',
    description:
      'Crea una cuenta USER activa con verificación UNVERIFIED. El correo se normaliza a minúsculas y la respuesta incluye el perfil y un JWT.',
  })
  @ApiBody({
    type: RegisterUserDto,
    description: 'Datos para crear la cuenta.',
  })
  @ApiCreatedResponse({
    type: RegisterResponseDto,
    description:
      'La cuenta se creó correctamente y se devuelve el perfil con un JWT.',
  })
  @ApiBadRequestResponse({
    description:
      'El correo, la contraseña o el nombre no cumplen las reglas de validación',
  })
  @ApiConflictResponse({ description: 'Ya existe una cuenta con ese correo' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al crear la cuenta.',
  })
  register(@Body() dto: RegisterUserDto): Promise<RegisterResponseDto> {
    return this.userService.create(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica una cuenta activa y devuelve su identificador y un JWT.',
  })
  @ApiBody({ type: LoginUserDto, description: 'Credenciales de la cuenta.' })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'La sesión se inició correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'El correo o la contraseña tienen un formato inválido',
  })
  @ApiUnauthorizedResponse({
    description:
      'El correo no existe, la contraseña es incorrecta o la cuenta está inactiva.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al iniciar sesión.',
  })
  login(@Body() dto: LoginUserDto): Promise<LoginResponseDto> {
    return this.userService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Invalida los tokens JWT previamente emitidos para el usuario autenticado. Requiere enviar un JWT válido.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'La sesión se cerró correctamente.',
    example: { message: 'Session successfuly closed' },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al cerrar la sesión.',
  })
  logout(@GetUser() user: User): Promise<MessageResponseDto> {
    return this.userService.logout(user);
  }

  // Las rutas /me van antes de /:id para que ':id' no las capture.

  @Get('me')
  @Auth()
  @ApiOperation({
    summary: 'Consultar mi perfil',
    description:
      'Devuelve el perfil asociado al JWT válido enviado en la cabecera Authorization.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'Se devuelve el perfil del usuario autenticado.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar el perfil.',
  })
  findMe(@GetUser() user: User): UserProfileDto {
    return this.userService.findMe(user);
  }

  @Patch('me')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar el perfil propio',
    description:
      'Permite cambiar fullName e info. fullName no se puede cambiar mientras la verificación esté PENDING o VERIFIED.',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Campos del perfil que se desean actualizar.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'El perfil se actualizó correctamente.',
  })
  @ApiBadRequestResponse({ description: 'El cuerpo del perfil no es válido' })
  @ApiForbiddenResponse({
    description:
      'No se puede cambiar fullName en el estado de verificación actual',
  })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al actualizar el perfil.',
  })
  updateMe(
    @GetUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.userService.updateMe(user, dto);
  }

  @Patch('me/password')
  @Auth()
  @ApiOperation({
    summary: 'Cambiar la contraseña',
    description:
      'Requiere la contraseña actual. La nueva contraseña debe tener entre 8 y 12 caracteres y ser distinta a la actual.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Contraseña actual y contraseña nueva.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'La contraseña se cambió correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'La nueva contraseña no cumple las reglas o es igual a la actual',
  })
  @ApiForbiddenResponse({ description: 'La contraseña actual es incorrecta' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al cambiar la contraseña.',
  })
  changePassword(
    @GetUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.userService.changePassword(user, dto);
  }

  @Patch('me/email')
  @Auth()
  @ApiOperation({
    summary: 'Cambiar el correo electrónico',
    description:
      'Requiere la contraseña actual. El nuevo correo se normaliza a minúsculas y se eliminan espacios externos.',
  })
  @ApiBody({
    type: ChangeEmailDto,
    description: 'Contraseña actual y correo nuevo.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description:
      'El correo se cambió correctamente y se devuelve el perfil actualizado.',
  })
  @ApiBadRequestResponse({
    description: 'El correo no es válido o coincide con el actual',
  })
  @ApiForbiddenResponse({ description: 'La contraseña actual es incorrecta' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  @ApiNotFoundResponse({
    description: 'La cuenta dejó de existir durante la operación.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al cambiar el correo electrónico.',
  })
  changeEmail(
    @GetUser() user: User,
    @Body() dto: ChangeEmailDto,
  ): Promise<UserProfileDto> {
    return this.userService.changeEmail(user, dto);
  }

  @Post('me/verification')
  @Auth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicitar verificación de identidad',
    description:
      'Actualiza verificationStatus a PENDING. Devuelve el perfil actualizado; no acepta una nueva solicitud si la cuenta ya está PENDING o VERIFIED.',
  })
  @ApiOkResponse({
    type: UserProfileDto,
    description:
      'La solicitud quedó pendiente y se devuelve el perfil actualizado.',
  })
  @ApiConflictResponse({
    description: 'La identidad ya está verificada o en revisión',
  })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al solicitar la verificación.',
  })
  requestVerification(@GetUser() user: User): Promise<UserProfileDto> {
    return this.userService.requestVerification(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar públicamente el perfil de un usuario activo',
    description:
      'No requiere autenticación; los usuarios inactivos no se exponen en este endpoint.',
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
    description: 'Se devuelve el perfil del usuario activo solicitado.',
  })
  @ApiBadRequestResponse({ description: 'El id no tiene formato UUID' })
  @ApiNotFoundResponse({ description: 'Usuario inexistente o inactivo' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar el usuario.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfileDto> {
    return this.userService.findPublicProfile(id);
  }
}

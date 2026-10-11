import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

// Almacenamiento provisional en disco. En Render (plan gratuito) el disco es
// efímero: migrar a almacenamiento externo privado antes de producción.
const verificationUpload = {
  storage: diskStorage({
    destination: 'uploads/identity-documents',
    filename: (_req, file, callback) =>
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException('Only JPG, PNG or PDF files are allowed'),
        false,
      );
    }
  },
};

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // TODO(Camilo): endpoints temporales de register/login para poder probar
  // los demás módulos. Reemplazar por los definitivos del módulo 1.
  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario (temporal, módulo 1)' })
  register(@Body() dto: RegisterUserDto) {
    return this.userService.create(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión (temporal, módulo 1)' })
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
    summary: 'Editar fullName, photoUrl e info (fullName bloqueado si está verificado o en revisión)',
  })
  updateMe(@GetUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user, dto);
  }

  @Patch('me/password')
  @Auth()
  @ApiOperation({ summary: 'Cambiar contraseña (requiere la contraseña actual)' })
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user, dto);
  }

  @Patch('me/email')
  @Auth()
  @ApiOperation({ summary: 'Cambiar email (requiere la contraseña actual)' })
  changeEmail(@GetUser() user: User, @Body() dto: ChangeEmailDto) {
    return this.userService.changeEmail(user, dto);
  }

  @Post('me/verification')
  @Auth()
  @ApiOperation({ summary: 'Solicitar verificación de identidad (estado PENDING)' })
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

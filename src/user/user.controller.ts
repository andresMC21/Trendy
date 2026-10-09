import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get(':id')
  findOne(@Param('id') id: string) {}

  @Delete(':id')
  remove(@Param('id') id: string) {}
}

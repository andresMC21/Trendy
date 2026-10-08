import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update.dto';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';

type UploadedDocument = {
  filename?: string;
  originalname?: string;
  path?: string;
};

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  register(@Body() registerDto: RegisterUserDto) {
    return this.userService.create(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginUserDto) {
    return this.userService.login(loginDto);
  }

  @Get('me')
  @Auth()
  getMe(@GetUser() user: User) {
    return this.userService.findMe(user);
  }

  @Patch('me')
  @Auth()
  updateMe(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateMe(user, updateUserDto);
  }

  @Post('me/verify')
  @Auth()
  @UseInterceptors(FileInterceptor('document'))
  requestVerification(
    @GetUser() user: User,
    @UploadedFile() document?: UploadedDocument,
  ) {
    return this.userService.requestVerification(user, document);
  }

  @Get(':id')
  @Auth()
  getPublicProfile(@Param('id') id: string) {
    return this.userService.findPublicProfile(id);
  }
}

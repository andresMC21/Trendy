import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }
  /*
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
      return this.userService.create(createUserDto);
    }*/

  /*
  @Get()
  findAll() {
    return this.userService.findAll();
  }
  */

  @Get(':id')
  findOne(@Param('id') id: string) {

  }

  /*
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {

  }*/

  @Delete(':id')
  remove(@Param('id') id: string) {

  }
}

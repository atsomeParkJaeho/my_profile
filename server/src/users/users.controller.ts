import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }

  // GET /api/users/auth-users
  @Get('auth-users')
  findAuthUsers() {
    return this.usersService.findAuthUsers();
  }

  // GET /api/users/auth-users/:id
  @Get('auth-users/:id')
  findAuthUserById(@Param('id') id: string) {
    return this.usersService.findAuthUserById(Number(id));
  }
  // 
  
  
  
}

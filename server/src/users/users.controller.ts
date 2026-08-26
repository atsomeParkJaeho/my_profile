import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

/* swagger에 노출 되는 소스 */
@ApiTags('사용자')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '전체 사용자 목록 조회' })
  @ApiResponse({ status: 200, description: '사용자 배열' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, description: '생성된 사용자' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }
}

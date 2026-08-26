import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ContactService } from './contact.service';

/* swagger에 노출 되는 소스 */
@ApiTags('문의')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '문의 전송 (이메일 발송 + DB 저장)' })
  @ApiBody({ schema: { example: { name: '홍길동', email: 'user@example.com', phone: '010-0000-0000', message: '문의 내용입니다.' } } })
  @ApiResponse({ status: 200, description: '전송 성공' })
  @Post('send')
  @HttpCode(200)
  send(@Body() dto: { name: string; email: string; phone?: string; message: string }) {
    return this.contactService.send(dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '문의 목록 조회' })
  @ApiResponse({ status: 200, description: '문의 기록 배열' })
  @Get('list')
  findAll() {
    return this.contactService.findAll();
  }
}

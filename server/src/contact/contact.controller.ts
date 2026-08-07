import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('send')
  @HttpCode(200)
  send(@Body() dto: { name: string; email: string; phone?: string; message: string }) {
    return this.contactService.send(dto);
  }

  @Get('list')
  findAll() {
    return this.contactService.findAll();
  }
}

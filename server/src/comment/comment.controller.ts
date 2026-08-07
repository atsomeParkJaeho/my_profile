import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':postId')
  findByPostId(@Param('postId') postId: string) {
    return this.commentService.findByPostId(Number(postId));
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: { postId: number; name: string; password: string; content: string }) {
    return this.commentService.create(body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Body() body: { password: string }) {
    return this.commentService.remove(Number(id), body.password);
  }
}

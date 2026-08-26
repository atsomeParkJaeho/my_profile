import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CommentService } from './comment.service';

/* swagger에 노출 되는 소스 */
@ApiTags('댓글')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '게시물의 댓글 목록 조회' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiResponse({ status: 200, description: '댓글 배열' })
  @Get(':postId')
  findByPostId(@Param('postId') postId: string) {
    return this.commentService.findByPostId(Number(postId));
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '댓글 작성' })
  @ApiBody({ schema: { example: { postId: 1, name: '작성자', password: 'pass123', content: '댓글 내용' } } })
  @ApiResponse({ status: 201, description: '작성된 댓글' })
  @Post()
  @HttpCode(201)
  create(@Body() body: { postId: number; name: string; password: string; content: string }) {
    return this.commentService.create(body);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '댓글 삭제 (비밀번호 확인)' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiBody({ schema: { example: { password: 'pass123' } } })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: '비밀번호 불일치' })
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Body() body: { password: string }) {
    return this.commentService.remove(Number(id), body.password);
  }
}

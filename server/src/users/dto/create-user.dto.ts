import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  /* swagger에 노출 되는 소스 */
  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MinLength(1)
  name: string;

  /* swagger에 노출 되는 소스 */
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  /* swagger에 노출 되는 소스 */
  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

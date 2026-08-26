import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  /* swagger에 노출 되는 소스 */
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  /* swagger에 노출 되는 소스 */
  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

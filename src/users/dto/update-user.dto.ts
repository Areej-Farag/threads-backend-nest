import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Hxj4t@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Hxj4t' })
  @IsOptional()
  @MinLength(8, { message: 'Username must be at least 8 characters long' })
  username?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name?: string;

  @ApiProperty({ example: 'Hxj4t' })
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(2, { message: 'Bio must be at least 2 characters long' })
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ProfilePicture?: string;
}

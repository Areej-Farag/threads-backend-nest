import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Hxj4t@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({ example: 'Hxj4t' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(8, { message: 'Username must be at least 8 characters long' })
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @ApiProperty({ example: 'Hxj4t' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(2, { message: 'Bio must be at least 2 characters long' })
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ProfilePicture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray({ message: 'Threads must be an array of thread IDs' })
  threads?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray({ message: 'Followers must be an array of user IDs' })
  followers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray({ message: 'Following must be an array of user IDs' })
  following?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray({ message: 'Communities must be an array of community IDs' })
  communities?: string[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MinLength,
} from 'class-validator';

export class RegisterDto {
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

  @ApiProperty({ example: 'Hxj4t' })
  @IsNotEmpty({ message: 'Confirm Password is required' })
  @MinLength(8, {
    message: 'Confirm Password must be at least 8 characters long',
  })
  confirmPassword!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(2, { message: 'Bio must be at least 2 characters long' })
  bio?: string | null;
}

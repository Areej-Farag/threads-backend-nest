import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { multerConfig } from 'src/upload/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User registration with optional profile picture',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        email: { type: 'string' },
        password: { type: 'string' },
        confirmPassword: { type: 'string' },
        username: { type: 'string' },
        name: { type: 'string' },
        // أضيفي أي حقول أخرى في RegisterDto
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async register(
    @Body() body: RegisterDto, // ← هنا نستقبل كل البيانات
    @UploadedFile() file: Express.Multer.File,
  ) {
    // تحويل البيانات إلى RegisterDto
    const registerDto: RegisterDto = {
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword,
      username: body.username,
      name: body.name,
      bio: body?.bio ?? null,
    };

    return this.authService.register(registerDto, file);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }
}

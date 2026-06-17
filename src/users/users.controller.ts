import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import type { JwtPayload } from 'src/auth/types';
import { multerConfig } from 'src/upload/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    console.log(user);
    return await this.usersService.findById(user.sub);
  }
  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit: number = 20,
    @Query('page') page: number = 1,
  ) {
    return await this.usersService.searchUsers(query, limit, page);
  }
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Delete('/:id')
  async deleteUser(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    if (user.sub !== id) {
      throw new UnauthorizedException(
        'You are not authorized to delete this user',
      );
    }
    return await this.usersService.delete(user.sub);
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('file', multerConfig))
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
        email: { type: 'string', format: 'email' },
        username: { type: 'string' },
        name: { type: 'string' },
        // أضيفي أي حقول أخرى في RegisterDto
      },
    },
  })
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.sub !== id) {
      throw new UnauthorizedException(
        'You are not authorized to delete this user',
      );
    }
    const existingUser = await this.usersService.findById(id);
    if (file) {
      return this.usersService.updateProfilePicture(user.sub, file);
    }
    if (!existingUser) {
      throw new Error('User not found');
    }
    const updateUserDto: UpdateUserDto = {
      email: body.email ?? existingUser.email,
      username: body.username ?? existingUser.username,
      name: body.name ?? existingUser.name,
      bio: body.bio ?? existingUser.bio,
    };

    return await this.usersService.update(user.sub, updateUserDto);
  }
}

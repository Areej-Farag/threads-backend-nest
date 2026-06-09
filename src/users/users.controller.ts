import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import type { JwtPayload } from 'src/auth/types';
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
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (user.sub !== id) {
      throw new UnauthorizedException(
        'You are not authorized to delete this user',
      );
    }
    return await this.usersService.update(user.sub, updateUserDto);
  }
}

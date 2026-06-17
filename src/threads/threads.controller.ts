import { Controller } from '@nestjs/common';
import {
  UseGuards,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Patch,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common/decorators';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ThreadsService } from './threads.service';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import type { JwtPayload } from 'src/auth/types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/upload/multer.config';

@ApiTags('Threads')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}
  @Get('user/:userId')
  async getUserThreads(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return await this.threadsService.findUserThreads(userId.toString());
  }

  @Get('me')
  async getMyThreads(
    @CurrentUser() currentUser: JwtPayload,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return await this.threadsService.findUserThreads(
      currentUser.sub,
      limit,
      page,
    );
  }
  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit: number = 20,
    @Query('page') page: number = 1,
  ) {
    return await this.threadsService.searchThread(query || '', limit, page);
  }

  @Get()
  async getAllThreads(
    @Query('limit') limit: number = 20,
    @Query('page') page: number = 1,
  ) {
    return await this.threadsService.findAll(limit, page);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Thread ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  async getThreadById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return await this.threadsService.findById(id);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Thread Creation with Optional Files',
    schema: {
      type: 'object',
      properties: {
        files: {
          // ← Change from 'file' to 'files'
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        text: { type: 'string' },
        community: { type: 'string' },
        parentId: { type: 'string' },
      },
    },
  })
  async createThread(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreateThreadDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const createThreadDto: CreateThreadDto = { ...body };
    return await this.threadsService.create(
      createThreadDto,
      currentUser.sub,
      files,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Thread ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  async deleteThread(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.threadsService.delete(id, currentUser.sub);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Thread ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  async updateThread(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
    @Body() updateThreadDto: UpdateThreadDto,
  ) {
    return await this.threadsService.update(
      updateThreadDto,
      id,
      currentUser.sub,
    );
  }

  @Post(':id/like')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Thread ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  async createLike(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.threadsService.createLike(id, currentUser.sub);
  }
  @Get('/:id/likes')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Thread ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  async getThreadsLike(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return await this.threadsService.showLikes(id);
  }
}

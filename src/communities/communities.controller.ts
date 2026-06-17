import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/types';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { CreateCommunityDto } from './dto/create-community.dto';
import { AuthGuard } from 'src/auth/auth.guard';

//  @ApiParam({
//     name: 'id',
//     type: String,
//     description: 'Thread ID (MongoDB ObjectId)',
//     example: '60f7b2c9a5d9e123456789ab',
//     required: true,
//   })
@ApiTags('Communities')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  async getAllCommunities(
    @Query('limit') limit: number = 20,
    @Query('page') page: number = 1,
  ) {
    return await this.communitiesService.getAllCommunities(limit, page);
  }

  @Get('search')
  async searchCommunities(
    @Query('query') query: string,
    @Query('limit') limit: number = 20,
    @Query('page') page: number = 1,
  ) {
    return await this.communitiesService.searchCommunities(query, limit, page);
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Get(':id')
  async getCommunityById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return await this.communitiesService.getCommunityById(id);
  }
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Get(':id/members')
  async getCommunityMembers(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return await this.communitiesService.getCommunityMembers(id);
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Get(':id/threads')
  async getCommunityThreads(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return await this.communitiesService.getCommunityThreads(id);
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Get(':id/admins')
  async getCommunityAdmins(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return await this.communitiesService.getCommunityAdmins(id);
  }

  @Post()
  async createCommunity(
    @Body() createCommunityDto: CreateCommunityDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.communitiesService.createCommunity(
      createCommunityDto,
      currentUser.sub,
    );
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Delete(':id')
  async deleteCommunity(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.communitiesService.deleteCommunity(id, currentUser.sub);
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Patch(':id')
  async updateCommunity(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return await this.communitiesService.updateCommunity(
      updateCommunityDto,
      id,
      currentUser.sub,
    );
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Patch(':id/join')
  async joinCommmunity(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.communitiesService.joinCommmunity(id, currentUser.sub);
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Patch(':id/leave')
  async leaveCommmunity(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.communitiesService.leaveCommmunity(id, currentUser.sub);
  }
  @Patch(':id/remove-member')
  async removeMember(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
    @Body('userEmail') userEmail: string,
  ) {
    return await this.communitiesService.deleteMember(
      userEmail,
      id,
      currentUser.sub,
    );
  }

  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Patch(':id/add-admin')
  async addAdmin(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
    @Body('userEmail') userEmail: string,
  ) {
    return await this.communitiesService.addAdmin(
      userEmail,
      id,
      currentUser.sub,
    );
  }
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Community ID (MongoDB ObjectId)',
    example: '60f7b2c9a5d9e123456789ab',
    required: true,
  })
  @Patch(':id/remove-admin')
  async removeAdmin(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: JwtPayload,
    @Body('userEmail') userEmail: string,
  ) {
    return await this.communitiesService.removeAdmin(
      userEmail,
      id,
      currentUser.sub,
    );
  }
}

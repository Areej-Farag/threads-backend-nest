import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Community, CommunityDocument } from './schema/community.schema';
import { Model, Types } from 'mongoose';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { UsersService } from 'src/users/users.service';
import { Thread, ThreadDocument } from 'src/threads/schema/thread.schema';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
    @InjectModel(Thread.name) private threadModel: Model<ThreadDocument>, // ← أضيفي دي
    private userService: UsersService,
  ) {}

  private async deleteThreadWithChildren(threadId: Types.ObjectId) {
    const children = await this.threadModel.find({ parentId: threadId });

    for (const child of children) {
      await this.deleteThreadWithChildren(child._id);
    }

    await this.threadModel.deleteOne({ _id: threadId });
  }

  async searchCommunities(query: string, limit: number = 20, page: number = 1) {
    try {
      const communities = await this.communityModel
        .find({ name: { $regex: query, $options: 'i' } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      return { communities, page, limit, nextPage: page + 1 };
    } catch (error) {
      console.error('Search community error:', error);
      throw new BadRequestException('Error searching community');
    }
  }
  async getAllCommunities(limit: number = 20, page: number = 1) {
    const communities = await this.communityModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return { communities, page, limit, nextPage: page + 1 };
  }

  async getCommunityThreads(communityId: Types.ObjectId) {
    const community = await this.communityModel
      .findById(communityId)
      .select('threads')
      .populate({
        path: 'threads',
        populate: [
          { path: 'author', select: 'username name profilePicture' },
          { path: 'likes', select: 'username name profilePicture' },
        ],
      })
      .exec();
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community.threads;
  }

  async getCommunityMembers(communityId: Types.ObjectId) {
    const community = await this.communityModel
      .findById(communityId)
      .select('members')
      .populate({
        path: 'members',
        select: 'username name profilePicture',
      })
      .exec();
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community.members;
  }

  async getCommunityAdmins(communityId: Types.ObjectId) {
    const community = await this.communityModel
      .findById(communityId)
      .select('admins')
      .populate({
        path: 'admins',
        select: 'username name profilePicture',
      })
      .exec();
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community.admins;
  }
  async createCommunity(
    createCommunityDto: CreateCommunityDto,
    userId: string,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const community = await this.communityModel.create({
      ...createCommunityDto,
      creator: new Types.ObjectId(userId),
      admins: [new Types.ObjectId(userId)],
      members: [new Types.ObjectId(userId)],
    });
    await this.userService.addCommunityToUser(userId, community._id);
  }

  async getCommunityById(id: Types.ObjectId) {
    const community = await this.communityModel.findById(id);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  async updateCommunity(
    updateCommunityDto: UpdateCommunityDto,
    communityId: Types.ObjectId,
    userId: string,
  ) {
    try {
      const userObjectId = new Types.ObjectId(userId);

      // 1. التحقق من وجود الكوميونتي + إن اليوزر أدمن فيها
      const community = await this.communityModel.findOne({
        _id: communityId,
        admins: userObjectId, // ← الطريقة الصحيحة
      });

      if (!community) {
        throw new NotFoundException(
          'Community not found or you are not an admin',
        );
      }

      // 2. التحديث
      const updatedCommunity = await this.communityModel.findByIdAndUpdate(
        communityId,
        { $set: updateCommunityDto },
        {
          new: true, // deprecated لكن لسه شغال
          runValidators: true,
        },
      );

      if (!updatedCommunity) {
        throw new BadRequestException('Failed to update community');
      }

      return updatedCommunity;
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  async deleteCommunity(communityId: Types.ObjectId, userId: string) {
    const community = await this.getCommunityById(communityId);

    if (community.creator.toString() !== userId) {
      throw new ForbiddenException(
        'Only the creator can delete this community',
      );
    }

    // 1. جيبي كل threads الـ community
    const threads = await this.threadModel.find({ community: communityId });

    // 2. احذفي كل thread مع children بتاعته
    for (const thread of threads) {
      await this.deleteThreadWithChildren(thread._id);
    }

    // 3. احذفي الـ community نفسها
    await this.communityModel.findByIdAndDelete(communityId);

    return { message: 'Community deleted successfully' };
  }
  async joinCommmunity(communityId: Types.ObjectId, userId: string) {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }
      const isUserExist = community?.members?.find(
        (member) => member.toString() === userId,
      );

      if (isUserExist) {
        throw new ConflictException('User already exists in community');
      }

      await this.userService.addCommunityToUser(userId, communityId);
      return await this.communityModel.findOneAndUpdate(
        { _id: communityId },
        { $push: { members: userId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  async leaveCommmunity(communityId: Types.ObjectId, userId: string) {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }
      const isUserExist = community?.members?.find(
        (member) => member.toString() === userId,
      );

      if (!isUserExist) {
        throw new NotFoundException('User does not exist in community');
      }
      if (community.creator.toString() === userId) {
        throw new BadRequestException(
          'Creator cannot leave — delete the community instead',
        );
      }

      await this.userService.removeCommunityFromUser(userId, communityId);
      return await this.communityModel.findOneAndUpdate(
        { _id: communityId },
        { $pull: { members: userId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  async deleteMember(
    userEmail: string,
    communityId: Types.ObjectId,
    adminId: string,
  ) {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }
      const isAdmin = community?.admins?.find(
        (admin) => admin.toString() === adminId,
      );
      if (!isAdmin) {
        throw new UnauthorizedException('only admin can delete member');
      }
      const user = await this.userService.findByEmail(userEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const userId = user._id;
      const isUserExist = community?.members?.find(
        (member) => member.toString() === userId.toString(),
      );

      if (!isUserExist) {
        throw new NotFoundException('User does not exist in community');
      }

      return await this.communityModel.findOneAndUpdate(
        { _id: communityId },
        { $pull: { members: userId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  async addAdmin(
    userEmail: string,
    communityId: Types.ObjectId,
    adminId: string,
  ) {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }
      const isAdmin = community?.admins?.find(
        (admin) => admin.toString() === adminId,
      );
      if (!isAdmin) {
        throw new UnauthorizedException(
          'only admin can add admin to community admins',
        );
      }
      const user = await this.userService.findByEmail(userEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.communityModel.findOneAndUpdate(
        { _id: communityId },
        { $push: { admins: user._id } },
        { new: true },
      );
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  }

  async removeAdmin(
    userEmail: string,
    communityId: Types.ObjectId,
    adminId: string,
  ) {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }
      const isAdmin = community?.admins?.find(
        (admin) => admin.toString() === adminId,
      );
      if (!isAdmin) {
        throw new UnauthorizedException(
          'only admin can add admin to community admins',
        );
      }
      const user = await this.userService.findByEmail(userEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.communityModel.findOneAndUpdate(
        { _id: communityId },
        { $pull: { admins: user._id } },
        { new: true },
      );
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  }

  async addThreadToCommunity(threadId: Types.ObjectId, communityId: string) {
    await this.communityModel.findOneAndUpdate(
      { _id: communityId },
      { $push: { threads: threadId } },
      { new: true },
    );
  }
}

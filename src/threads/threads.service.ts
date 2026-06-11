// backend/src/threads/threads.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread, ThreadDocument } from './schema/thread.schema';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UsersService } from '../users/users.service';
import { CommunitiesService } from 'src/communities/communities.service';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly userService: UsersService,
    @InjectModel(Thread.name) private threadModel: Model<ThreadDocument>,
    private readonly communityService: CommunitiesService,
  ) {}

  /**
   * إنشاء ثريد جديد (Post أو Comment)
   */
  async create(
    createThreadDto: CreateThreadDto,
    userId: string,
  ): Promise<ThreadDocument> {
    const parentId = createThreadDto.parentId;
    const community = createThreadDto.community;
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const threadData: any = {
      ...createThreadDto,
      author: new Types.ObjectId(userId),
      parentId: parentId ? new Types.ObjectId(parentId) : null,
      community: community ? new Types.ObjectId(community) : null,
    };

    try {
      const createdThread = await this.threadModel.create(threadData);
      if (community) {
        await this.communityService.addThreadToCommunity(
          createdThread._id,
          community,
        );
      }
      if (parentId) {
        await this.threadModel.findOneAndUpdate(
          { _id: parentId },
          { $push: { comments: createdThread._id } },
          { new: true },
        );
      }
      return createdThread;
    } catch (error) {
      console.error('Create thread error:', error);
      throw new BadRequestException('Error creating thread');
    }
  }

  async findById(id: Types.ObjectId): Promise<ThreadDocument> {
    try {
      const thread = await this.threadModel
        .findById(id)
        .populate({
          path: 'author',
          select: 'username name profilePicture',
        })
        .populate({
          path: 'likes',
          select: 'username name profilePicture',
        })
        .populate({
          path: 'comments',
          populate: [
            {
              path: 'author',
              select: 'username name profilePicture',
            },
            {
              path: 'likes',
              select: 'username name profilePicture',
            },
          ],
        })
        .exec();

      if (!thread) {
        throw new NotFoundException(
          `Thread with ID ${id.toString()} not found`,
        );
      }

      return thread;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Find thread error:', error);
      throw new BadRequestException('Error fetching thread');
    }
  }

  async findAll(limit: number = 20, page: number = 1) {
    const threads = await this.threadModel
      .find({ parentId: null })
      .populate({
        path: 'author',
        select: 'username name profilePicture',
      })
      .populate({
        path: 'likes',
        select: 'username name profilePicture',
      })
      .populate({
        path: 'comments',
        populate: [
          { path: 'author', select: 'username name profilePicture' },
          { path: 'likes', select: 'username name profilePicture' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    return { threads, page, limit, nextPage: page + 1 };
  }

  async findUserThreads(userId: string, limit: number = 20, page: number = 1) {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const threads = await this.threadModel
        .find({ author: userObjectId })
        .populate({
          path: 'author',
          select: 'username name profilePicture',
        })
        .populate({
          path: 'likes',
          select: 'username name profilePicture',
        })
        .populate({
          path: 'comments',
          populate: [
            { path: 'author', select: 'username name profilePicture' },
            { path: 'likes', select: 'username name profilePicture' },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      return { threads, page, limit, nextPage: page + 1 };
    } catch (error) {
      console.error('Find user threads error:', error);
      throw new BadRequestException('Error fetching user threads');
    }
  }

  async update(
    updateThreadDto: UpdateThreadDto,
    threadId: Types.ObjectId,
    userId: string,
  ): Promise<ThreadDocument> {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.author.toString() !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this thread',
      );
    }

    try {
      const updatedThread = await this.threadModel.findByIdAndUpdate(
        threadId,
        { $set: updateThreadDto },
        { new: true, runValidators: true },
      );

      if (!updatedThread) {
        throw new BadRequestException('Failed to update thread');
      }

      return updatedThread;
    } catch (error) {
      console.error('Update thread error:', error);
      throw new BadRequestException('Error updating thread');
    }
  }

  async delete(threadId: Types.ObjectId, userId: string) {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    if (thread.author.toString() !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this thread',
      );
    }

    await this.deleteWithChildren(threadId);

    return { success: true, message: 'Thread and all replies deleted' };
  }

  private async deleteWithChildren(threadId: Types.ObjectId) {
    const children = await this.threadModel.find({ parentId: threadId });

    for (const child of children) {
      await this.deleteWithChildren(child._id);
    }

    await this.threadModel.deleteOne({ _id: threadId });
  }

  async createLike(threadId: Types.ObjectId, userId: string) {
    try {
      const thread = await this.threadModel.findById(threadId);
      if (!thread) {
        throw new NotFoundException('Thread not found');
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existingLike = await this.threadModel.findOne({
        _id: threadId,
        likes: { $in: [userId] },
      });

      if (existingLike) {
        await this.threadModel.findOneAndUpdate(
          { _id: threadId },
          { $pull: { likes: userId } },
        );
        return {
          success: true,
          message: 'Like removed successfully',
        };
      }
      await this.threadModel.findOneAndUpdate(
        { _id: threadId },
        { $push: { likes: userId } },
      );

      return {
        success: true,
        message: 'Like added successfully',
      };
    } catch (error) {
      console.error('Create like error:', error);
      throw new BadRequestException('Error creating like');
    }
  }

  async showLikes(threadId: Types.ObjectId) {
    try {
      const thread = await this.threadModel.findById(threadId).populate({
        path: 'likes',
        select: 'username name profilePicture',
      });
      if (!thread) {
        throw new NotFoundException('Thread not found');
      }

      return {
        success: true,
        message: 'Likes fetched successfully',
        likes: thread.likes,
      };
    } catch (error) {
      console.error('Show likes error:', error);
      throw new BadRequestException('Error showing likes');
    }
  }

  async searchThread(query: string, limit: number = 20, page: number = 1) {
    try {
      const threads = await this.threadModel
        .find({ text: { $regex: query, $options: 'i' } })
        .populate({
          path: 'author',
          select: 'username name profilePicture',
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();
      return { threads, page, limit, nextPage: page + 1 };
    } catch (error) {
      console.error('Search thread error:', error);
      throw new BadRequestException('Error searching thread');
    }
  }
}

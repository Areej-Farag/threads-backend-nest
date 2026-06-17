// backend/src/threads/threads.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Thread, ThreadDocument } from './schema/thread.schema';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UsersService } from '../users/users.service';
import { CommunitiesService } from 'src/communities/communities.service';
import { UploadService } from 'src/upload/upload.service';
import { MediaDocument } from 'src/upload/schema/media.schema';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly userService: UsersService,
    @InjectModel(Thread.name) private threadModel: Model<ThreadDocument>,
    private uploadService: UploadService,
    private readonly communityService: CommunitiesService,
  ) {}

  // async createThreadWithImages(
  //   createThreadDto: CreateThreadDto,
  //   userId: string,
  //   files?: Express.Multer.File[],
  // ) {
  //   const session = await this.threadModel.db.startSession();
  //   session.startTransaction();

  //   try {
  //     let mediaDocs: MediaDocument[] = [];

  //     // 1. رفع الصور (لو فيه)
  //     if (files && files.length > 0) {
  //       mediaDocs = await this.uploadService.uploadMultiple(files, 'thread');
  //     }

  //     // 2. إنشاء الثريد
  //     const thread = new this.threadModel({
  //       ...createThreadDto,
  //       author: userId,
  //       images: mediaDocs.map((m) => m._id),
  //     });

  //     const savedThread = await thread.save({ session });

  //     await session.commitTransaction();
  //     return savedThread.populate('images');
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }
  async create(
    createThreadDto: CreateThreadDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<ThreadDocument> {
    const parentId = createThreadDto.parentId;
    const community = createThreadDto.community;
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const session = await this.threadModel.db.startSession();
    session.startTransaction();

    try {
      let mediaDocs: MediaDocument[] = [];
      if (files && files.length > 0) {
        mediaDocs = await this.uploadService.uploadMultiple(files, 'thread');
      }
      const threadData: any = {
        ...createThreadDto,
        author: new Types.ObjectId(userId),
        parentId: parentId ? new Types.ObjectId(parentId) : null,
        community: community ? new Types.ObjectId(community) : null,
        media: mediaDocs.map((m) => m._id),
      };

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

      await this.userService.addThreadToUser(userId, createdThread._id);
      return createdThread.populate('media');
    } catch (error) {
      console.error('Create thread error:', error);
      throw new BadRequestException('Error creating thread');
    } finally {
      await session.endSession();
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

      return thread.populate('media');
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
          { path: 'media', select: 'url mediaType' },
        ],
      })
      .populate('media')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    return {
      threads,
      page,
      limit,
      nextPage: page + 1,
    };
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
            { path: 'media', select: 'url mediaType' },
          ],
        })
        .populate('media')
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

    const session = await this.threadModel.db.startSession();
    session.startTransaction();

    try {
      await this.deleteWithChildren(threadId, session, userId);
      await this.userService.removeThreadFromUser(userId, threadId);
      await session.commitTransaction();

      return {
        success: true,
        message: 'Thread and all related data deleted successfully',
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete transaction failed:', error);
      throw new InternalServerErrorException('Failed to delete thread');
    } finally {
      await session.endSession();
    }
  }

  private async deleteWithChildren(
    threadId: Types.ObjectId,
    session: ClientSession,
    userId: string,
  ) {
    // 1. حذف الـ replies (children) أولاً (Recursion)
    const children = await this.threadModel
      .find({ parentId: threadId })
      .session(session);

    for (const child of children) {
      if (userId === child.author.toString()) {
        await this.userService.removeThreadFromUser(userId, child._id);
      }
      await this.deleteWithChildren(child._id, session, userId);
    }

    // 2. حذف الثريد الحالي
    const thread = await this.threadModel.findById(threadId).session(session);
    if (thread) {
      // حذف الميديا أولاً
      await this.deleteThreadMedia(thread, session);

      // حذف الثريد
      await this.threadModel.deleteOne({ _id: threadId }).session(session);
    }
  }

  private async deleteThreadMedia(
    thread: ThreadDocument,
    session?: ClientSession,
  ) {
    if (!thread.media || thread.media.length === 0) return;

    // حذف من Cloudinary + MongoDB (من خلال UploadService)
    await this.uploadService.deleteThreadMedia(thread.media);

    // مش محتاجين نعدل الـ array لأننا هنحذف الـ document كامل
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
        await this.userService.RemoveLikedThread(threadId, userId);
        return {
          success: true,
          message: 'Like removed successfully',
        };
      }
      await this.threadModel.findOneAndUpdate(
        { _id: threadId },
        { $push: { likes: userId } },
      );
      await this.userService.AddLikedThread(threadId, userId);
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
        .populate('media')
        .sort({
          createdAt: -1,
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

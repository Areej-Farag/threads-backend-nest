import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';
import { UploadService } from 'src/upload/upload.service';
import { CreateUserDto } from './dto/create-user-dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private uploadService: UploadService,
  ) {}

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    // how to start a transaction in MongoDB
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      // 1. رفع الصورة
      const media = await this.uploadService.uploadSingle(file, 'profile');

      // 2. تحديث اليوزر
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { profilePicture: media._id },
        { session, new: true },
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await session.commitTransaction();
      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return await createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email: email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await this.userModel.findById(id).exec();
  }

  async delete(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const session = await this.userModel.db.startSession();
    session.startTransaction();
    try {
      if (user.profilePicture) {
        await this.uploadService.deleteMediaById(user.profilePicture);
      }
      await this.userModel.findByIdAndDelete(id).session(session).exec();
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    try {
      const updatedUser = await this.userModel.findOneAndUpdate(
        { _id: id },
        { $set: updateUserDto },
        { new: true, runValidators: true },
      );
      const userObject = updatedUser!.toObject();
      delete (userObject as any)?.password;

      return { message: 'User updated successfully', user: userObject };
    } catch {
      throw new HttpException('Error updating user', 500);
    }
  }

  async searchUsers(query: string, limit: number = 20, page: number = 1) {
    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    return { users, page, limit, nextPage: page + 1 };
  }

  async addCommunityToUser(userId: string, communityId: Types.ObjectId) {
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $push: { communities: communityId } },
      { new: true },
    );
  }

  async removeCommunityFromUser(userId: string, communityId: Types.ObjectId) {
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { communities: communityId } },
      { new: true },
    );
  }

  async addThreadToUser(userId: string, threadId: Types.ObjectId) {
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $push: { threads: threadId } },
      { new: true },
    );
  }

  async removeThreadFromUser(userId: string, threadId: Types.ObjectId) {
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { threads: threadId } },
      { new: true },
    );
  }

  async AddLikedThread(threadId: Types.ObjectId, userId: string) {
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $push: { likedThreads: threadId } },
      { new: true },
    );
  }
  async RemoveLikedThread(threadId: Types.ObjectId, userId: string) {
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { likedThreads: threadId } },
      { new: true },
    );
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: any): Promise<UserDocument> {
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
    await this.userModel.findByIdAndDelete(id).exec();
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
}

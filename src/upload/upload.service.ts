import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { Media, MediaDocument } from './schema/media.schema';
import { CLOUDINARY } from './cloudinary.constants';
import { Inject } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @Inject(CLOUDINARY) private cloudinary: typeof Cloudinary,
  ) {}

  async uploadSingle(
    file: Express.Multer.File,
    type: 'profile' | 'thread' = 'thread',
  ): Promise<MediaDocument> {
    if (!file) throw new BadRequestException('File is required');
    try {
      const uploadResult = await this.uploadToCloudinary(file);

      const media = new this.mediaModel({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type,
      });

      return media.save();
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    type: 'thread' = 'thread',
  ): Promise<MediaDocument[]> {
    const uploadPromises = files.map((file) => this.uploadSingle(file, type));
    return Promise.all(uploadPromises);
  }
  // async uploadFile(file: Express.Multer.File): Promise<MediaDocument> {
  //   if (!file) {
  //     throw new BadRequestException('File is required');
  //   }

  //   try {
  //     const uploadResult = await this.uploadToCloudinary(file);

  //     const media = new this.mediaModel({
  //       url: uploadResult.secure_url || uploadResult.url,
  //       public_id: uploadResult.public_id,
  //       name: file.originalname,
  //     });

  //     return await media.save();
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     throw new InternalServerErrorException('Failed to upload file');
  //   }
  // }

  private async uploadToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    // طريقة أفضل: رفع من Buffer مباشرة (بدل file.path)
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream({ resource_type: 'auto' }, (error, result) => {
          if (error) {
            const message =
              error instanceof Error ? error.message : JSON.stringify(error);
            return reject(new Error(message));
          }
          resolve(result as UploadApiResponse);
        })
        .end(file.buffer); // ← مهم: نستخدم buffer
    });
  }

  async deleteMedia(public_id: string): Promise<void> {
    if (!public_id) return;

    try {
      await this.cloudinary.uploader.destroy(public_id);
      await this.mediaModel.deleteOne({ public_id: public_id }); // أو public_id حسب اسم الحقل في السكيما
      console.log(`Media deleted: ${public_id}`);
    } catch (error) {
      console.error(`Failed to delete media ${public_id}:`, error);
      throw error;
    }
  }

  async deleteManyMedia(public_ids: string[]): Promise<void> {
    if (!public_ids || public_ids.length === 0) return;

    try {
      // حذف من Cloudinary (batch)
      await this.cloudinary.api.delete_resources(public_ids);

      // حذف من MongoDB
      await this.mediaModel.deleteMany({ public_id: { $in: public_ids } });
    } catch (error) {
      console.error('Failed to delete multiple media:', error);
      throw error;
    }
  }
  async deleteMediaById(mediaId: Types.ObjectId | string): Promise<void> {
    const media = await this.mediaModel.findById(mediaId);
    if (!media) return;

    await this.deleteMedia(media.public_id);
  }

  // حذف كل الميديا الخاصة بثريد (الأهم)
  async deleteThreadMedia(mediaIds: Types.ObjectId[] | any[]): Promise<void> {
    if (!mediaIds || mediaIds.length === 0) return;

    const medias = await this.mediaModel.find({ _id: { $in: mediaIds } });

    const public_ids = medias.map((m) => m.public_id).filter(Boolean);

    if (public_ids.length > 0) {
      await this.deleteManyMedia(public_ids);
    }
  }

  async getMediaById(Id: Types.ObjectId): Promise<string> {
    try {
      await this.mediaModel.findById(Id).exec();
      return 'media deleted successfully';
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }
}

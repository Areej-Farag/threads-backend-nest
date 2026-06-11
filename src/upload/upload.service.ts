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

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @Inject(CLOUDINARY) private cloudinary: typeof Cloudinary,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<MediaDocument> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      const uploadResult = await this.uploadToCloudinary(file);

      const media = new this.mediaModel({
        url: uploadResult.secure_url || uploadResult.url,
        publicId: uploadResult.public_id,
        name: file.originalname,
      });

      return await media.save();
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    // طريقة أفضل: رفع من Buffer مباشرة (بدل file.path)
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream({ resource_type: 'auto' }, (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        })
        .end(file.buffer); // ← مهم: نستخدم buffer
    });
  }

  async deleteFile(publicId: string) {
    try {
      await this.cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Delete file error:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}

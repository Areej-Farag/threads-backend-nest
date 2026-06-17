import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schema/media.schema';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';

@Module({
  imports: [
    MulterModule.register(multerConfig),
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
  providers: [CloudinaryProvider, UploadService],
  controllers: [UploadController],
  exports: [CloudinaryProvider, UploadService, MulterModule],
})
export class UploadModule {}

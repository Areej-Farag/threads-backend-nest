import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { multerConfig } from './multer.config';
import { Types } from 'mongoose';

@ApiTags('Upload')
@Controller('file-upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload-single')
  @ApiConsumes('multipart/form-data') // ← مهم جداً
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded - Check Swagger multipart config',
      );
    }

    return this.uploadService.uploadSingle(file);
  }

  @Post('upload-multible')
  @ApiConsumes('multipart/form-data') // ← مهم جداً
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadMultiple(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded - Check Swagger multipart config',
      );
    }

    return this.uploadService.uploadMultiple([file]);
  }

  @ApiParam({
    name: 'public_id',
    type: String,
    description: 'Public ID of the file to delete',
    required: true,
  })
  @Delete('delete/:public_id')
  async deleteFile(@Param('public_id') public_id: string) {
    return await this.uploadService.deleteMedia(public_id);
  }

  @Get('get/:id')
  async getMedia(@Param('id') id: string) {
    return await this.uploadService.getMediaById(new Types.ObjectId(id));
  }
}

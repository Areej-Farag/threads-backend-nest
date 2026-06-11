import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { multerConfig } from './multer.config';

@ApiTags('Upload')
@Controller('file-upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded - Check Swagger multipart config',
      );
    }

    return this.uploadService.uploadFile(file);
  }

  @ApiParam({
    name: 'publicId',
    type: String,
    description: 'Public ID of the file to delete',
    required: true,
  })
  @Delete('delete/:publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    return this.uploadService.deleteFile(publicId);
  }
}

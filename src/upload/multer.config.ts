// src/upload/multer.config.ts
import { memoryStorage, FileFilterCallback } from 'multer';
import { Request } from 'express';

export const multerConfig = {
  storage: memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // الحد الأقصى لعدد الملفات في request واحد (للثريدات)
  },

  fileFilter: (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        ),
      );
    }
  },
};

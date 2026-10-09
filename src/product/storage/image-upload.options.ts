import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: MAX_IMAGES_PER_PRODUCT },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'), false);
    }
    cb(null, true);
  },
};

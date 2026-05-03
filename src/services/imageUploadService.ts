import multer from 'multer';
import { Request } from 'express';
import * as s3Service from './s3UploadService.js';

// Configure multer for memory storage (files will be uploaded to S3, not disk)
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max
  }
});

export const uploadAny = () => upload.any();
export const uploadSingle = (fieldName: string = 'images') => upload.single(fieldName);
export const uploadArray = (fieldName: string = 'images', maxCount: number = 10) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

/**
 * Upload single image to S3
 */
export const uploadToSpaces = async (
  file: Express.Multer.File,
  folder: string = 'properties'
): Promise<string> => {
  return await s3Service.uploadImageToS3(file, folder);
};

/**
 * Upload multiple images to S3
 */
export const uploadMultipleToSpaces = async (
  files: Express.Multer.File[],
  folder: string = 'properties'
): Promise<string[]> => {
  return await s3Service.uploadMultipleImagesToS3(files, folder);
};

/**
 * Delete single image from S3
 */
export const deleteFromSpaces = async (fileUrl: string): Promise<void> => {
  return await s3Service.deleteImageFromS3(fileUrl);
};

/**
 * Delete multiple images from S3
 */
export const deleteMultipleFromSpaces = async (fileUrls: string[]): Promise<void> => {
  return await s3Service.deleteMultipleImagesFromS3(fileUrls);
};

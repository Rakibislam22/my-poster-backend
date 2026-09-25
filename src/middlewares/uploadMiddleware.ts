import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const singleUpload = (fieldName: string) => upload.single(fieldName);

export const multipleUpload = (fieldName: string, maxCount = 5) =>
  upload.array(fieldName, maxCount);

export const posterPhotosUpload = upload.fields([
  { name: 'candidatePhoto', maxCount: 1 },
  { name: 'leaderPhotos', maxCount: 3 },
]);

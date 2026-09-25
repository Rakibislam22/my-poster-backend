import { Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { ApiResponse } from '../utils/apiResponse';

export const uploadSingleImage = async (req: Request, res: Response) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, 'No file was uploaded.');
  }

  const folder = (req.query.folder as string) || 'uploads';
  const result = await storageService.uploadFile(req.file, folder);

  return ApiResponse.created(
    res,
    {
      url: result.url,
      publicId: result.publicId,
      bytes: result.bytes,
    },
    'File uploaded successfully'
  );
};

export const uploadMultipleImages = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return ApiResponse.badRequest(res, 'No files were uploaded.');
  }

  const folder = (req.query.folder as string) || 'uploads';
  const uploadPromises = files.map((file) => storageService.uploadFile(file, folder));
  const results = await Promise.all(uploadPromises);

  return ApiResponse.created(
    res,
    {
      files: results.map((r) => ({
        url: r.url,
        publicId: r.publicId,
        bytes: r.bytes,
      })),
      count: results.length,
    },
    'Files uploaded successfully'
  );
};

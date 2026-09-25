import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

class StorageService {
  private isCloudinaryConfigured: boolean;
  private localUploadsDir: string;

  constructor() {
    this.isCloudinaryConfigured = Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    );

    if (this.isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
      console.log('☁️ StorageService: Using Cloudinary CDN for assets');
    } else {
      console.log('📁 StorageService: Cloudinary not configured. Using local disk storage fallback (/uploads)');
    }

    this.localUploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(this.localUploadsDir)) {
      fs.mkdirSync(this.localUploadsDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<UploadResult> {
    const ext = path.extname(file.originalname).replace('.', '') || 'png';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    if (this.isCloudinaryConfigured) {
      return this.uploadToCloudinary(file.buffer, folder, filename);
    } else {
      return this.saveToLocalDisk(file.buffer, folder, filename);
    }
  }

  async saveBuffer(
    buffer: Buffer,
    folder = 'posters',
    extension = 'png'
  ): Promise<UploadResult> {
    const filename = `poster-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;

    if (this.isCloudinaryConfigured) {
      return this.uploadToCloudinary(buffer, folder, filename);
    } else {
      return this.saveToLocalDisk(buffer, folder, filename);
    }
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    publicIdName: string
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `rice_together/${folder}`,
          public_id: path.parse(publicIdName).name,
          resource_type: 'image',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload returned empty response'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  private async saveToLocalDisk(
    buffer: Buffer,
    folder: string,
    filename: string
  ): Promise<UploadResult> {
    const targetDir = path.join(this.localUploadsDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativePath = `/uploads/${folder}/${filename}`;
    const publicUrl = `http://localhost:${env.PORT}${relativePath}`;

    return {
      url: publicUrl,
      publicId: `${folder}/${filename}`,
      bytes: buffer.length,
    };
  }
}

export const storageService = new StorageService();

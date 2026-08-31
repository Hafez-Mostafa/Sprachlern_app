import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  duration?: number;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  getClient() {
    return cloudinary;
  }

  upload(
    buffer: Buffer,
    options: { folder: string; resource_type: 'image' | 'video' },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resource_type,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned no result'));
            return;
          }

          resolve(result as unknown as CloudinaryUploadResult);
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async destroy(publicId: string, resourceType: 'image' | 'video') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}

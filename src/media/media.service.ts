import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

export interface UploadedMediaFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
}

export interface MediaUploadResult {
  assetId: string;
  publicId: string;
  url: string;
  resourceType: string;
  format: string;
  bytes: number;
  duration?: number;
}

// Feste, zentrale Ordnerstruktur in Cloudinary. Einzige Stelle im Projekt,
// an der diese Pfade definiert werden.
const CLOUDINARY_ROOT_FOLDER = 'sprachlernapp';
export const CLOUDINARY_IMAGE_FOLDER = `${CLOUDINARY_ROOT_FOLDER}/images`;
export const CLOUDINARY_AUDIO_FOLDER = `${CLOUDINARY_ROOT_FOLDER}/audio`;

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Einzige Stelle im Projekt, die direkt mit Cloudinary spricht.
 */
@Injectable()
export class MediaService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadImage(file: UploadedMediaFile): Promise<MediaUploadResult> {
    this.validateFile(file, IMAGE_TYPES);
    return this.upload(file, CLOUDINARY_IMAGE_FOLDER, 'image');
  }

  async uploadAudio(file: UploadedMediaFile): Promise<MediaUploadResult> {
    this.validateFile(file, AUDIO_TYPES);
    // Cloudinary behandelt Audiodateien als resource_type "video".
    return this.upload(file, CLOUDINARY_AUDIO_FOLDER, 'video');
  }

  // publicId bevorzugt (zuverlässig, kommt direkt aus der DB-Zeile).
  // url ist nur noch der Fallback für Altdaten von vor der public_id-
  // Migration, wo wir sie aus der URL zurückrechnen müssen.
  async deleteImage(
    url: string | null | undefined,
    publicId?: string | null,
  ): Promise<void> {
    await this.delete(url, publicId, 'image');
  }

  async deleteAudio(
    url: string | null | undefined,
    publicId?: string | null,
  ): Promise<void> {
    await this.delete(url, publicId, 'video');
  }

  private async upload(
    file: UploadedMediaFile,
    folder: string,
    resourceType: 'image' | 'video',
  ): Promise<MediaUploadResult> {
    try {
      const result = await this.cloudinaryService.upload(file.buffer, {
        folder,
        resource_type: resourceType,
      });

      return {
        assetId: result.asset_id,
        publicId: result.public_id,
        url: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
      };
    } catch {
      throw new InternalServerErrorException('Media-Upload fehlgeschlagen');
    }
  }

  private async delete(
    url: string | null | undefined,
    publicId: string | null | undefined,
    resourceType: 'image' | 'video',
  ): Promise<void> {
    const resolvedPublicId =
      publicId ?? (url ? this.extractPublicId(url, resourceType) : null);

    if (!resolvedPublicId) {
      return;
    }

    try {
      await this.cloudinaryService.destroy(resolvedPublicId, resourceType);
    } catch {
      // Asset war ggf. schon manuell in Cloudinary gelöscht — den
      // aufrufenden Vorgang deswegen nicht scheitern lassen.
    }
  }

  private extractPublicId(
    url: string,
    resourceType: 'image' | 'video',
  ): string | null {
    try {
      const pathname = decodeURIComponent(new URL(url).pathname);
      const match = pathname.match(
        new RegExp(`/${resourceType}/upload(?:/v\\d+)?/(.+?)(?:\\.[^./]+)?$`),
      );
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private validateFile(
    file: UploadedMediaFile | undefined,
    allowedTypes: Set<string>,
  ) {
    if (!file) {
      throw new BadRequestException('Eine Datei ist erforderlich');
    }
    if (!allowedTypes.has(file.mimetype)) {
      throw new BadRequestException('Nicht unterstützter Dateityp');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Die Datei darf höchstens 25 MB groß sein');
    }
  }
}

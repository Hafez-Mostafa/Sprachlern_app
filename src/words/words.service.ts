import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { ImageUpsertDto } from './dto/image-upsert.dto';
import { AudioUpsertDto } from './dto/audio-upsert.dto';
import { MediaService, UploadedMediaFile } from '../media/media.service';

@Injectable()
export class WordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async create(dto: CreateWordDto) {
    return this.prisma.words.create({
      data: { text: dto.text, language_id: dto.language_id },
    });
  }

  async createMany(dtos: CreateWordDto[]) {
    return this.prisma.words.createManyAndReturn({
      data: dtos.map((dto) => ({
        text: dto.text,
        language_id: dto.language_id,
      })),
      skipDuplicates: true,
    });
  }

  async findAll(filters: { language_id?: number; search?: string }) {
    const rows = await this.prisma.words.findMany({
      where: {
        ...(filters.language_id !== undefined && {
          language_id: filters.language_id,
        }),
        ...(filters.search && {
          text: { contains: filters.search, mode: 'insensitive' },
        }),
      },
      include: { app_languages: true },
    });

    return rows.map((w) => this.toWordDto(w));
  }

  async findOne(wordId: string) {
    const word = await this.prisma.words.findUnique({
      where: { word_id: wordId },
      include: { images: true, audios: true, app_languages: true },
    });

    if (!word) {
      throw new NotFoundException(`Wort mit ID ${wordId} nicht gefunden`);
    }

    return {
      ...this.toWordDto(word),
      image: word.images ?? undefined,
      audio: word.audios ?? undefined,
    };
  }

  private toWordDto(word: {
    word_id: string;
    text: string;
    app_languages: { app_language_id: number; name: string };
  }) {
    return {
      word_id: word.word_id,
      text: word.text,
      language: {
        id: word.app_languages.app_language_id,
        name: word.app_languages.name,
      },
    };
  }

  async update(wordId: string, dto: UpdateWordDto) {
    await this.findOne(wordId);
    return this.prisma.words.update({
      where: { word_id: wordId },
      data: { ...dto },
    });
  }

  async remove(wordId: string) {
    const word = await this.prisma.words.findUnique({
      where: { word_id: wordId },
      include: { images: true, audios: true },
    });
    if (!word) {
      throw new NotFoundException(`Wort mit ID ${wordId} nicht gefunden`);
    }

    try {
      await this.prisma.words.delete({ where: { word_id: wordId } });
    } catch (error: any) {
      // Prisma-Fehlercode P2003: Fremdschlüssel-Verletzung.
      // task_words.word_id hat ON DELETE RESTRICT — ein Wort, das noch in
      // einer Aufgabe verwendet wird, darf nicht gelöscht werden.
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Wort wird noch in mindestens einer Aufgabe verwendet',
        );
      }
      throw error;
    }

    await this.mediaService.deleteImage(
      word.images?.url,
      word.images?.public_id,
    );
    await this.mediaService.deleteAudio(
      word.audios?.url,
      word.audios?.public_id,
    );

    return { message: 'Wort gelöscht' };
  }

  // --- Bild (1:1) ---

  async setImage(wordId: string, dto: ImageUpsertDto) {
    await this.findOne(wordId);
    return this.prisma.images.upsert({
      where: { word_id: wordId },
      create: {
        word_id: wordId,
        url: dto.url,
        description: dto.description,
        public_id: null,
        format: null,
        bytes: null,
      },
      update: {
        url: dto.url,
        description: dto.description,
        public_id: null,
        format: null,
        bytes: null,
      },
    });
  }

  async uploadImage(
    wordId: string,
    file: UploadedMediaFile,
    description?: string,
  ) {
    const word = await this.findOne(wordId);
    const media = await this.mediaService.uploadImage(file);
    await this.mediaService.deleteImage(word.image?.url, word.image?.public_id);

    return this.prisma.images.upsert({
      where: { word_id: wordId },
      create: {
        word_id: wordId,
        url: media.url,
        public_id: media.publicId,
        format: media.format,
        bytes: media.bytes,
        description,
      },
      update: {
        url: media.url,
        public_id: media.publicId,
        format: media.format,
        bytes: media.bytes,
        description,
      },
    });
  }

  async removeImage(wordId: string) {
    const word = await this.findOne(wordId);
    if (!word.image) {
      throw new NotFoundException('Kein Bild für dieses Wort vorhanden');
    }

    await this.prisma.images.delete({ where: { word_id: wordId } });
    await this.mediaService.deleteImage(word.image.url, word.image.public_id);

    return { message: 'Bild entfernt' };
  }

  // --- Audio (1:1) ---

  async setAudio(wordId: string, dto: AudioUpsertDto) {
    await this.findOne(wordId);
    return this.prisma.audios.upsert({
      where: { word_id: wordId },
      create: {
        word_id: wordId,
        url: dto.url,
        duration_ms: dto.duration_ms,
        public_id: null,
        format: null,
        bytes: null,
      },
      update: {
        url: dto.url,
        duration_ms: dto.duration_ms,
        public_id: null,
        format: null,
        bytes: null,
      },
    });
  }

  async uploadAudio(wordId: string, file: UploadedMediaFile) {
    const word = await this.findOne(wordId);
    const media = await this.mediaService.uploadAudio(file);
    await this.mediaService.deleteAudio(word.audio?.url, word.audio?.public_id);

    return this.prisma.audios.upsert({
      where: { word_id: wordId },
      create: {
        word_id: wordId,
        url: media.url,
        public_id: media.publicId,
        format: media.format,
        bytes: media.bytes,
        duration_ms: media.duration
          ? Math.round(media.duration * 1000)
          : undefined,
      },
      update: {
        url: media.url,
        public_id: media.publicId,
        format: media.format,
        bytes: media.bytes,
        duration_ms: media.duration
          ? Math.round(media.duration * 1000)
          : undefined,
      },
    });
  }

  async removeAudio(wordId: string) {
    const word = await this.findOne(wordId);
    if (!word.audio) {
      throw new NotFoundException('Kein Audio für dieses Wort vorhanden');
    }

    await this.prisma.audios.delete({ where: { word_id: wordId } });
    await this.mediaService.deleteAudio(word.audio.url, word.audio.public_id);

    return { message: 'Audio entfernt' };
  }
}

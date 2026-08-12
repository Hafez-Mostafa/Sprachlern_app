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

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.words.findMany({
      where: {
        ...(filters.language_id !== undefined && {
          language_id: filters.language_id,
        }),
        ...(filters.search && {
          text: { contains: filters.search, mode: 'insensitive' },
        }),
      },
    });
  }

  // Gibt das Wort inkl. Bild und Audio zurück (WordDetail laut Spec)
  async findOne(wordId: string) {
    const word = await this.prisma.words.findUnique({
      where: { word_id: wordId },
      include: { images: true, audios: true },
    });
    if (!word) {
      throw new NotFoundException(`Wort mit ID ${wordId} nicht gefunden`);
    }
    return word;
  }

  async update(wordId: string, dto: UpdateWordDto) {
    await this.findOne(wordId);
    return this.prisma.words.update({
      where: { word_id: wordId },
      data: { ...dto },
    });
  }

  async remove(wordId: string) {
    await this.findOne(wordId);
    try {
      await this.prisma.words.delete({ where: { word_id: wordId } });
    } catch (error: any) {
      // Prisma-Fehlercode P2003: Fremdschlüssel-Verletzung.
      // Tritt auf, weil task_words.word_id ON DELETE RESTRICT gesetzt hat —
      // ein Wort, das noch in einer Aufgabe verwendet wird, darf laut Spec
      // nicht gelöscht werden (409 statt 500).
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Wort wird noch in mindestens einer Aufgabe verwendet',
        );
      }
      throw error;
    }
    return { message: 'Wort gelöscht' };
  }

  // --- Bild (1:1) ---

  async setImage(wordId: string, dto: ImageUpsertDto) {
    await this.findOne(wordId); // stellt sicher, dass das Wort existiert
    return this.prisma.images.upsert({
      where: { word_id: wordId },
      create: { word_id: wordId, url: dto.url, description: dto.description },
      update: { url: dto.url, description: dto.description },
    });
  }

  async removeImage(wordId: string) {
    await this.findOne(wordId);
    await this.prisma.images.delete({ where: { word_id: wordId } });
    return { message: 'Bild entfernt' };
  }

  // --- Audio (1:1) ---

  async setAudio(wordId: string, dto: AudioUpsertDto) {
    await this.findOne(wordId);
    return this.prisma.audios.upsert({
      where: { word_id: wordId },
      create: { word_id: wordId, url: dto.url, duration_ms: dto.duration_ms },
      update: { url: dto.url, duration_ms: dto.duration_ms },
    });
  }

  async removeAudio(wordId: string) {
    await this.findOne(wordId);
    await this.prisma.audios.delete({ where: { word_id: wordId } });
    return { message: 'Audio entfernt' };
  }
}

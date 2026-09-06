import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import type { UploadedMediaFile } from '../media/media.service';
import { CreateConceptDto } from './dto/create-concept.dto';
import { ConceptTranslationDto } from './dto/concept-translation.dto';
import { ConceptImageUpsertDto } from './dto/concept-image-upsert.dto';

@Injectable()
export class ConceptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  // Zentrale Stelle, die auf ein vollständiges Concept prüft: genau ein
  // Text pro aktuell aktiver app_language, nicht mehr, nicht weniger.
  private async assertCompleteLanguageSet(languageIds: number[]) {
    const activeLanguages = await this.prisma.app_languages.findMany({
      select: { app_language_id: true, name: true },
    });

    const activeIds = activeLanguages.map((l) => l.app_language_id);
    const providedIds = new Set(languageIds);

    const missing = activeLanguages.filter(
      (l) => !providedIds.has(l.app_language_id),
    );
    const unknown = languageIds.filter((id) => !activeIds.includes(id));
    const duplicates = languageIds.filter(
      (id, i) => languageIds.indexOf(id) !== i,
    );

    if (missing.length > 0 || unknown.length > 0 || duplicates.length > 0) {
      const parts: string[] = [];
      if (missing.length > 0) {
        parts.push(
          `Fehlende Sprachen: ${missing.map((l) => `${l.name} (${l.app_language_id})`).join(', ')}`,
        );
      }
      if (unknown.length > 0) {
        parts.push(`Unbekannte language_id(s): ${unknown.join(', ')}`);
      }
      if (duplicates.length > 0) {
        parts.push(`Mehrfach angegebene language_id(s): ${duplicates.join(', ')}`);
      }
      throw new BadRequestException(
        `Ein Concept benötigt genau einen Text pro aktiver Sprache. ${parts.join(' | ')}`,
      );
    }
  }

  async create(dto: CreateConceptDto) {
    await this.assertCompleteLanguageSet(
      dto.translations.map((t) => t.language_id),
    );

    return this.prisma.$transaction(async (tx) => {
      const concept = await tx.concepts.create({ data: {} });

      await tx.words.createMany({
        data: dto.translations.map((t) => ({
          concept_id: concept.concept_id,
          language_id: t.language_id,
          text: t.text,
        })),
      });

      return this.findOne(concept.concept_id, tx);
    });
  }

  async findAll() {
    const concepts = await this.prisma.concepts.findMany({
      include: { words: { include: { audios: true } }, images: true },
      orderBy: { created_at: 'desc' },
    });
    return concepts.map((c) => this.toConceptDto(c));
  }

  async findOne(conceptId: string, tx: PrismaService | any = this.prisma) {
    const concept = await tx.concepts.findUnique({
      where: { concept_id: conceptId },
      include: { words: { include: { audios: true } }, images: true },
    });
    if (!concept) {
      throw new NotFoundException(`Concept mit ID ${conceptId} nicht gefunden`);
    }
    return this.toConceptDto(concept);
  }

  // Fügt eine bislang fehlende Sprache zu einem bestehenden Concept hinzu
  // (z. B. weil eine neue app_language nachträglich eingeführt wurde und
  // alte Concepts jetzt unvollständig sind).
  async addTranslation(conceptId: string, dto: ConceptTranslationDto) {
    const concept = await this.prisma.concepts.findUnique({
      where: { concept_id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException(`Concept mit ID ${conceptId} nicht gefunden`);
    }

    const language = await this.prisma.app_languages.findUnique({
      where: { app_language_id: dto.language_id },
    });
    if (!language) {
      throw new BadRequestException(
        `Unbekannte language_id: ${dto.language_id}`,
      );
    }

    try {
      await this.prisma.words.create({
        data: {
          concept_id: conceptId,
          language_id: dto.language_id,
          text: dto.text,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Für diese Sprache existiert an diesem Concept bereits ein Text',
        );
      }
      throw error;
    }

    return this.findOne(conceptId);
  }

  async remove(conceptId: string) {
    const concept = await this.prisma.concepts.findUnique({
      where: { concept_id: conceptId },
      include: { images: true },
    });
    if (!concept) {
      throw new NotFoundException(`Concept mit ID ${conceptId} nicht gefunden`);
    }

    // Bild in Cloudinary mit aufräumen, bevor die DB-Zeile (cascade) verschwindet.
    if (concept.images) {
      await this.mediaService.deleteImage(concept.images.url, concept.images.public_id);
    }

    await this.prisma.concepts.delete({ where: { concept_id: conceptId } });
    return { message: 'Concept gelöscht' };
  }

  // --- Bild (concept-weit, ein einziges Bild für alle Sprachen) ---

  async setImage(conceptId: string, dto: ConceptImageUpsertDto) {
    await this.assertConceptExists(conceptId);
    const existing = await this.prisma.images.findUnique({
      where: { concept_id: conceptId },
    });
    if (existing) {
      await this.mediaService.deleteImage(existing.url, existing.public_id);
    }

    await this.prisma.images.upsert({
      where: { concept_id: conceptId },
      create: {
        concept_id: conceptId,
        url: dto.url,
        public_id: dto.public_id,
        format: dto.format,
        bytes: dto.bytes,
        description: dto.description,
      },
      update: {
        url: dto.url,
        public_id: dto.public_id,
        format: dto.format,
        bytes: dto.bytes,
        description: dto.description,
      },
    });

    return this.findOne(conceptId);
  }

  async uploadImage(
    conceptId: string,
    file: UploadedMediaFile,
    description?: string,
  ) {
    await this.assertConceptExists(conceptId);

    const existing = await this.prisma.images.findUnique({
      where: { concept_id: conceptId },
    });

    const result = await this.mediaService.uploadImage(file);

    if (existing) {
      await this.mediaService.deleteImage(existing.url, existing.public_id);
    }

    await this.prisma.images.upsert({
      where: { concept_id: conceptId },
      create: {
        concept_id: conceptId,
        url: result.url,
        public_id: result.publicId,
        format: result.format,
        bytes: result.bytes,
        description,
      },
      update: {
        url: result.url,
        public_id: result.publicId,
        format: result.format,
        bytes: result.bytes,
        description,
      },
    });

    return this.findOne(conceptId);
  }

  async removeImage(conceptId: string) {
    await this.assertConceptExists(conceptId);
    const existing = await this.prisma.images.findUnique({
      where: { concept_id: conceptId },
    });
    if (!existing) {
      throw new NotFoundException('Kein Bild für dieses Concept vorhanden');
    }
    await this.mediaService.deleteImage(existing.url, existing.public_id);
    await this.prisma.images.delete({ where: { concept_id: conceptId } });
    return { message: 'Bild gelöscht' };
  }

  private async assertConceptExists(conceptId: string) {
    const concept = await this.prisma.concepts.findUnique({
      where: { concept_id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException(`Concept mit ID ${conceptId} nicht gefunden`);
    }
  }

  // Mapping auf das öffentliche Concept-Schema: ein Bild, Liste der
  // Sprach-Wörter (jeweils inkl. Audio, falls vorhanden).
  private toConceptDto(concept: {
    concept_id: string;
    created_at: Date;
    updated_at: Date;
    images: { url: string; description: string | null } | null;
    words: {
      word_id: string;
      language_id: number;
      text: string;
      audios: { url: string } | null;
    }[];
  }) {
    return {
      concept_id: concept.concept_id,
      created_at: concept.created_at,
      updated_at: concept.updated_at,
      image: concept.images
        ? { url: concept.images.url, description: concept.images.description }
        : null,
      words: concept.words.map((w) => ({
        word_id: w.word_id,
        language_id: w.language_id,
        text: w.text,
        audio_url: w.audios?.url ?? null,
      })),
    };
  }
}

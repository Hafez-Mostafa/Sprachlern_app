import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWordDto } from './dto/update-word.dto';
import { AudioUpsertDto } from './dto/audio-upsert.dto';
import { MediaService, UploadedMediaFile } from '../media/media.service';

// Wörter werden nicht mehr eigenständig angelegt/gelöscht als Gruppe -
// das passiert jetzt ausschließlich über ConceptsModule (POST /concepts,
// POST /concepts/:id/translations), damit ein Wort nie ohne sein Concept
// (und damit ohne das zugehörige, geteilte Bild) existieren kann. Dieser
// Service verwaltet nur noch: Text-Korrektur, Audio (weiterhin 1:1 pro
// Wort/Sprache) und Lesezugriffe.
@Injectable()
export class WordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

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
      include: {
        app_languages: true,
        audios: true,
        concepts: { include: { images: true } },
      },
    });

    return rows.map((w) => this.toWordDto(w));
  }

  async findOne(wordId: string) {
    const word = await this.prisma.words.findUnique({
      where: { word_id: wordId },
      include: {
        app_languages: true,
        audios: true,
        concepts: { include: { images: true } },
      },
    });

    if (!word) {
      throw new NotFoundException(`Wort mit ID ${wordId} nicht gefunden`);
    }

    return this.toWordDto(word);
  }

  async findTasksUsingWord(wordId: string) {
    await this.findOne(wordId); // wirft 404, falls das Wort nicht existiert

    const links = await this.prisma.task_words.findMany({
      where: { word_id: wordId },
      include: {
        tasks: {
          include: { exercises: true, question_pool: true },
        },
      },
    });

    return links.map((link) => ({
      task_id: link.tasks.task_id,
      question: link.tasks.question_pool.question,
      exercise_id: link.tasks.exercise_id,
      exercise_title: link.tasks.exercises?.title ?? null,
    }));
  }

  private toWordDto(word: {
    word_id: string;
    concept_id: string;
    text: string;
    app_languages: { app_language_id: number; name: string };
    audios: { url: string; public_id?: string | null } | null;
    concepts: { images: { url: string; description: string | null } | null };
  }) {
    return {
      word_id: word.word_id,
      concept_id: word.concept_id,
      text: word.text,
      language: {
        id: word.app_languages.app_language_id,
        name: word.app_languages.name,
      },
      // Das Bild kommt jetzt vom (geteilten) Concept, nicht mehr vom Wort
      // selbst - für Frontend-Abwärtskompatibilität weiterhin unter "image".
      image: word.concepts.images
        ? {
            url: word.concepts.images.url,
            description: word.concepts.images.description,
          }
        : undefined,
      audio: word.audios ?? undefined,
    };
  }

  async update(wordId: string, dto: UpdateWordDto) {
    await this.findOne(wordId);
    await this.prisma.words.update({
      where: { word_id: wordId },
      data: { text: dto.text },
    });
    return this.findOne(wordId);
  }

  // Ein einzelnes Sprach-Wort kann entfernt werden (z. B. Tippfehler-Eintrag
  // neu anlegen), das Concept selbst bleibt bestehen. Achtung: Dadurch kann
  // ein Concept wieder "unvollständig" werden (nicht mehr für jede Sprache
  // ein Text) - das ist hier bewusst erlaubt (Korrektur-Fall), wird aber im
  // Frontend als Warnung markiert werden.
  async remove(wordId: string) {
    const word = await this.prisma.words.findUnique({
      where: { word_id: wordId },
      include: { audios: true },
    });
    if (!word) {
      throw new NotFoundException(`Wort mit ID ${wordId} nicht gefunden`);
    }

    try {
      await this.prisma.words.delete({ where: { word_id: wordId } });
    } catch (error: any) {
      // Prisma-Fehlercode P2003: Fremdschlüssel-Verletzung.
      // task_words.word_id — ein Wort, das noch in einer Aufgabe verwendet
      // wird, darf nicht gelöscht werden.
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Wort wird noch in mindestens einer Aufgabe verwendet',
        );
      }
      throw error;
    }

    await this.mediaService.deleteAudio(
      word.audios?.url,
      word.audios?.public_id,
    );

    return { message: 'Wort gelöscht' };
  }

  // --- Audio (weiterhin 1:1 pro Wort/Sprache - eine Aussprache pro Sprache) ---

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

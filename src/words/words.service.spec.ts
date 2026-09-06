import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WordsService } from './words.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';

describe('WordsService', () => {
  let service: WordsService;
  let prisma: any;

  const fakeWord = {
    word_id: 'w-1',
    concept_id: 'c-1',
    text: 'Apfel',
    language_id: 1,
    created_at: new Date(),
    app_languages: { app_language_id: 1, name: 'Deutsch' },
    concepts: { images: null },
    audios: null,
  };

  beforeEach(async () => {
    prisma = {
      words: {
        create: jest.fn(),
        createManyAndReturn: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      images: { upsert: jest.fn(), delete: jest.fn() },
      audios: { upsert: jest.fn(), delete: jest.fn() },
    };
    const media = { deleteAudio: jest.fn(), uploadAudio: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MediaService, useValue: media },
      ],
    }).compile();

    service = module.get<WordsService>(WordsService);
  });

  it('findOne() lädt das Wort inklusive Sprache, Concept-Bild und Audio', async () => {
    prisma.words.findUnique.mockResolvedValue(fakeWord);

    await service.findOne('w-1');

    expect(prisma.words.findUnique).toHaveBeenCalledWith({
      where: { word_id: 'w-1' },
      include: {
        app_languages: true,
        audios: true,
        concepts: { include: { images: true } },
      },
    });
  });

  it('findOne() wirft NotFoundException bei unbekannter ID', async () => {
    prisma.words.findUnique.mockResolvedValue(null);

    await expect(service.findOne('unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('findAll — Filter', () => {
    it('kombiniert language_id- und search-Filter (case-insensitive)', async () => {
      prisma.words.findMany.mockResolvedValue([]);

      await service.findAll({ language_id: 1, search: 'apf' });

      expect(prisma.words.findMany).toHaveBeenCalledWith({
        where: {
          language_id: 1,
          text: { contains: 'apf', mode: 'insensitive' },
        },
        include: {
          app_languages: true,
          audios: true,
          concepts: { include: { images: true } },
        },
      });
    });
  });

  describe('remove — Foreign-Key-Schutz', () => {
    it('übersetzt Prisma-Fehler P2003 in ConflictException (409), nicht in einen 500er', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      prisma.words.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.remove('w-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('reicht andere Fehler unverändert weiter', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      const otherError = new Error('irgendein anderer Fehler');
      prisma.words.delete.mockRejectedValue(otherError);

      await expect(service.remove('w-1')).rejects.toBe(otherError);
    });
  });

  describe('setAudio — Upsert-Verhalten (PUT = setzen oder ersetzen)', () => {
    it('uploadAudio() löscht ein vorhandenes Cloudinary-Audio nach erfolgreichem Upload', async () => {
      prisma.words.findUnique.mockResolvedValue({
        ...fakeWord,
        audios: {
          word_id: 'w-1',
          url: 'https://res.cloudinary.com/demo/video/upload/words/w-1/audios/old-audio.mp3',
        },
      });
      prisma.audios.upsert.mockResolvedValue({});
      const media = (service as any).mediaService;
      media.uploadAudio.mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/video/upload/words/w-1/audios/new-audio.mp3',
        publicId: 'words/w-1/audios/new-audio',
        format: 'mp3',
        bytes: 12,
        resourceType: 'video',
        assetId: 'asset-1',
        duration: 2.5,
      });

      await service.uploadAudio('w-1', {
        buffer: Buffer.from('audio'),
        mimetype: 'audio/mpeg',
        size: 12,
      });

      expect(media.deleteAudio).toHaveBeenCalledWith(
        'https://res.cloudinary.com/demo/video/upload/words/w-1/audios/old-audio.mp3',
        undefined,
      );
    });

    it('setAudio() ruft audios.upsert() mit word_id als eindeutigem Schlüssel auf', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      prisma.audios.upsert.mockResolvedValue({});

      await service.setAudio('w-1', {
        url: 'https://example.com/apfel.mp3',
        duration_ms: 1200,
      });

      expect(prisma.audios.upsert).toHaveBeenCalledWith({
        where: { word_id: 'w-1' },
        create: {
          word_id: 'w-1',
          url: 'https://example.com/apfel.mp3',
          duration_ms: 1200,
          public_id: null,
          format: null,
          bytes: null,
        },
        update: {
          url: 'https://example.com/apfel.mp3',
          duration_ms: 1200,
          public_id: null,
          format: null,
          bytes: null,
        },
      });
    });
  });
});

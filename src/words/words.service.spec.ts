import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WordsService } from './words.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WordsService', () => {
  let service: WordsService;
  let prisma: any;

  const fakeWord = {
    word_id: 'w-1',
    text: 'Apfel',
    language_id: 1,
    created_at: new Date(),
    images: null,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [WordsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WordsService>(WordsService);
  });

  it('findOne() lädt das Wort inklusive Bild und Audio (WordDetail)', async () => {
    prisma.words.findUnique.mockResolvedValue(fakeWord);

    await service.findOne('w-1');

    expect(prisma.words.findUnique).toHaveBeenCalledWith({
      where: { word_id: 'w-1' },
      include: { images: true, audios: true },
    });
  });

  it('findOne() wirft NotFoundException bei unbekannter ID', async () => {
    prisma.words.findUnique.mockResolvedValue(null);

    await expect(service.findOne('unknown')).rejects.toBeInstanceOf(NotFoundException);
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
      });
    });
  });

  describe('remove — Foreign-Key-Schutz', () => {
    it('übersetzt Prisma-Fehler P2003 in ConflictException (409), nicht in einen 500er', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      prisma.words.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.remove('w-1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('reicht andere Fehler unverändert weiter', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      const otherError = new Error('irgendein anderer Fehler');
      prisma.words.delete.mockRejectedValue(otherError);

      await expect(service.remove('w-1')).rejects.toBe(otherError);
    });
  });

  describe('setImage / setAudio — Upsert-Verhalten (PUT = setzen oder ersetzen)', () => {
    it('setImage() ruft images.upsert() mit word_id als eindeutigem Schlüssel auf', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      prisma.images.upsert.mockResolvedValue({});

      await service.setImage('w-1', { url: 'https://example.com/apfel.png', description: 'Apfel' });

      expect(prisma.images.upsert).toHaveBeenCalledWith({
        where: { word_id: 'w-1' },
        create: { word_id: 'w-1', url: 'https://example.com/apfel.png', description: 'Apfel' },
        update: { url: 'https://example.com/apfel.png', description: 'Apfel' },
      });
    });

    it('setAudio() ruft audios.upsert() mit word_id als eindeutigem Schlüssel auf', async () => {
      prisma.words.findUnique.mockResolvedValue(fakeWord);
      prisma.audios.upsert.mockResolvedValue({});

      await service.setAudio('w-1', { url: 'https://example.com/apfel.mp3', duration_ms: 1200 });

      expect(prisma.audios.upsert).toHaveBeenCalledWith({
        where: { word_id: 'w-1' },
        create: { word_id: 'w-1', url: 'https://example.com/apfel.mp3', duration_ms: 1200 },
        update: { url: 'https://example.com/apfel.mp3', duration_ms: 1200 },
      });
    });

    it('setImage() prüft zuerst, ob das Wort existiert', async () => {
      prisma.words.findUnique.mockResolvedValue(null);

      await expect(
        service.setImage('unknown', { url: 'https://example.com/x.png' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.images.upsert).not.toHaveBeenCalled();
    });
  });
});

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExercisesService', () => {
  let service: ExercisesService;
  let prisma: any;

  const fakeExercise = {
    exercise_id: 'e-1',
    title: 'Farben auf Arabisch',
    language_id: 2,
    exercise_type_id: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      exercises: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExercisesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
  });

  it('create() setzt is_active standardmäßig auf true, wenn nicht angegeben', async () => {
    prisma.exercises.create.mockResolvedValue(fakeExercise);

    await service.create({ title: 'Test', language_id: 1, exercise_type_id: 1 });

    const createArg = prisma.exercises.create.mock.calls[0][0];
    expect(createArg.data.is_active).toBe(true);
  });

  describe('findAll — dynamische Filter', () => {
    it('baut keine Filter ein, wenn nichts übergeben wurde', async () => {
      prisma.exercises.findMany.mockResolvedValue([]);

      await service.findAll({});

      expect(prisma.exercises.findMany).toHaveBeenCalledWith({ where: {} });
    });

    it('wendet nur die tatsächlich übergebenen Filter an', async () => {
      prisma.exercises.findMany.mockResolvedValue([]);

      await service.findAll({ language_id: 2 });

      expect(prisma.exercises.findMany).toHaveBeenCalledWith({
        where: { language_id: 2 },
      });
    });

    it('kombiniert mehrere Filter gleichzeitig', async () => {
      prisma.exercises.findMany.mockResolvedValue([]);

      await service.findAll({ language_id: 2, exercise_type_id: 1, is_active: true });

      expect(prisma.exercises.findMany).toHaveBeenCalledWith({
        where: { language_id: 2, exercise_type_id: 1, is_active: true },
      });
    });
  });

  it('findOne() wirft NotFoundException bei unbekannter ID', async () => {
    prisma.exercises.findUnique.mockResolvedValue(null);

    await expect(service.findOne('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove() prüft Existenz, bevor gelöscht wird', async () => {
    prisma.exercises.findUnique.mockResolvedValue(fakeExercise);
    prisma.exercises.delete.mockResolvedValue(fakeExercise);

    await service.remove('e-1');

    expect(prisma.exercises.delete).toHaveBeenCalledWith({ where: { exercise_id: 'e-1' } });
  });
});

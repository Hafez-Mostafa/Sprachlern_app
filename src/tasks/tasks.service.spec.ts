import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;

  const fakeTask = {
    task_id: 't-1',
    exercise_id: 'e-1',
    question: 'Was ist rot?',
    correct_answer: 'أحمر',
    position: 0,
    created_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      tasks: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      task_words: {
        create: jest.fn(),
        createManyAndReturn: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('create() setzt position standardmäßig auf 0', async () => {
    prisma.tasks.create.mockResolvedValue(fakeTask);

    await service.create('e-1', { question: 'Q', correct_answer: 'A' });

    expect(prisma.tasks.create.mock.calls[0][0].data.position).toBe(0);
  });

  it('findAllForExercise() sortiert nach position aufsteigend', async () => {
    prisma.tasks.findMany.mockResolvedValue([fakeTask]);

    await service.findAllForExercise('e-1');

    expect(prisma.tasks.findMany).toHaveBeenCalledWith({
      where: { exercise_id: 'e-1' },
      orderBy: { position: 'asc' },
    });
  });

  it('findOne() wirft NotFoundException bei unbekannter taskId', async () => {
    prisma.tasks.findUnique.mockResolvedValue(null);

    await expect(service.findOne('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('assignWord', () => {
    it('legt die Zuordnung an, wenn Aufgabe und Wort gültig sind', async () => {
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.task_words.create.mockResolvedValue({ task_id: 't-1', word_id: 'w-1', position: 0 });

      await service.assignWord('t-1', 'w-1', 0);

      expect(prisma.task_words.create).toHaveBeenCalledWith({
        data: { task_id: 't-1', word_id: 'w-1', position: 0 },
      });
    });

    it('übersetzt Prisma-Fehler P2002 (Duplikat) in ConflictException', async () => {
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.task_words.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.assignWord('t-1', 'w-1', 0)).rejects.toBeInstanceOf(ConflictException);
    });

    it('übersetzt Prisma-Fehler P2003 (Wort existiert nicht) in NotFoundException', async () => {
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.task_words.create.mockRejectedValue({ code: 'P2003' });

      await expect(service.assignWord('t-1', 'unbekannt', 0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('removeWordFromTask', () => {
    it('wirft NotFoundException, wenn die Zuordnung nicht existiert', async () => {
      prisma.task_words.findUnique.mockResolvedValue(null);

      await expect(service.removeWordFromTask('t-1', 'w-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.task_words.delete).not.toHaveBeenCalled();
    });

    it('löscht die Zuordnung, wenn sie existiert', async () => {
      prisma.task_words.findUnique.mockResolvedValue({ task_id: 't-1', word_id: 'w-1' });
      prisma.task_words.delete.mockResolvedValue({});

      const result = await service.removeWordFromTask('t-1', 'w-1');

      expect(result).toEqual({ message: 'Zuordnung entfernt' });
    });
  });
});

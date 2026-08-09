import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LearningProgressService', () => {
  let service: LearningProgressService;
  let prisma: any;

  const fakeChild = { child_id: 'c-1', guardian_id: 'g-1' };
  const fakeTask = { task_id: 't-1', correct_answer: 'صغير' };
  const inProgressStatus = { progress_status_id: 2, name: 'IN_PROGRESS' };
  const completedStatus = { progress_status_id: 3, name: 'COMPLETED' };

  beforeEach(async () => {
    prisma = {
      child_profiles: { findUnique: jest.fn() },
      tasks: { findUnique: jest.fn() },
      progress_status: { findUnique: jest.fn() },
      learning_progress: { findMany: jest.fn(), upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LearningProgressService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LearningProgressService>(LearningProgressService);
  });

  describe('Besitzer-Prüfung (Kind muss dem anfragenden Guardian gehören)', () => {
    it('findForChild() wirft NotFoundException, wenn das Kind nicht existiert', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(null);

      await expect(service.findForChild('unknown', 'g-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findForChild() wirft ForbiddenException bei fremdem Kind', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);

      await expect(service.findForChild('c-1', 'anderer-guardian')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('submitAnswer() prüft die Besitzer-Zugehörigkeit, bevor irgendetwas gespeichert wird', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);

      await expect(
        service.submitAnswer('t-1', 'anderer-guardian', { child_id: 'c-1', answer: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.learning_progress.upsert).not.toHaveBeenCalled();
    });
  });

  describe('submitAnswer — serverseitige Bewertung', () => {
    it('bewertet eine falsche Antwort als IN_PROGRESS mit score 0', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.progress_status.findUnique.mockResolvedValue(inProgressStatus);
      prisma.learning_progress.upsert.mockResolvedValue({});

      await service.submitAnswer('t-1', 'g-1', { child_id: 'c-1', answer: 'falsch' });

      const upsertArg = prisma.learning_progress.upsert.mock.calls[0][0];
      expect(upsertArg.create.score).toBe(0);
      expect(upsertArg.create.completed_at).toBeNull();
      expect(prisma.progress_status.findUnique).toHaveBeenCalledWith({
        where: { name: 'IN_PROGRESS' },
      });
    });

    it('bewertet eine korrekte Antwort als COMPLETED mit score 100', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.progress_status.findUnique.mockResolvedValue(completedStatus);
      prisma.learning_progress.upsert.mockResolvedValue({});

      await service.submitAnswer('t-1', 'g-1', { child_id: 'c-1', answer: 'صغير' });

      const upsertArg = prisma.learning_progress.upsert.mock.calls[0][0];
      expect(upsertArg.create.score).toBe(100);
      expect(upsertArg.create.completed_at).toBeInstanceOf(Date);
    });

    it('ignoriert führende/nachfolgende Leerzeichen beim Vergleich (trim)', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.progress_status.findUnique.mockResolvedValue(completedStatus);
      prisma.learning_progress.upsert.mockResolvedValue({});

      await service.submitAnswer('t-1', 'g-1', { child_id: 'c-1', answer: '  صغير  ' });

      const upsertArg = prisma.learning_progress.upsert.mock.calls[0][0];
      expect(upsertArg.create.score).toBe(100);
    });

    it('nutzt child_id_task_id als eindeutigen Schlüssel für den Upsert (ein Eintrag pro Kind+Aufgabe)', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);
      prisma.tasks.findUnique.mockResolvedValue(fakeTask);
      prisma.progress_status.findUnique.mockResolvedValue(inProgressStatus);
      prisma.learning_progress.upsert.mockResolvedValue({});

      await service.submitAnswer('t-1', 'g-1', { child_id: 'c-1', answer: 'x' });

      const upsertArg = prisma.learning_progress.upsert.mock.calls[0][0];
      expect(upsertArg.where).toEqual({
        child_id_task_id: { child_id: 'c-1', task_id: 't-1' },
      });
    });

    it('wirft NotFoundException, wenn die Aufgabe nicht existiert', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);
      prisma.tasks.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAnswer('unknown', 'g-1', { child_id: 'c-1', answer: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LookupsService } from './lookups.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LookupsService', () => {
  let service: LookupsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      app_languages: { findMany: jest.fn().mockResolvedValue([]) },
      exercise_types: { findMany: jest.fn().mockResolvedValue([]) },
      progress_status: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LookupsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LookupsService>(LookupsService);
  });

  it('getLanguages() sortiert nach app_language_id aufsteigend', async () => {
    await service.getLanguages();
    expect(prisma.app_languages.findMany).toHaveBeenCalledWith({
      orderBy: { app_language_id: 'asc' },
    });
  });

  it('getExerciseTypes() sortiert nach exercise_type_id aufsteigend', async () => {
    await service.getExerciseTypes();
    expect(prisma.exercise_types.findMany).toHaveBeenCalledWith({
      orderBy: { exercise_type_id: 'asc' },
    });
  });

  it('getProgressStatuses() sortiert nach progress_status_id aufsteigend', async () => {
    await service.getProgressStatuses();
    expect(prisma.progress_status.findMany).toHaveBeenCalledWith({
      orderBy: { progress_status_id: 'asc' },
    });
  });
});

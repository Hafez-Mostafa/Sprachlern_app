import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChildProfilesService } from './child-profiles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChildProfilesService', () => {
  let service: ChildProfilesService;
  let prisma: any;

  const fakeChild = {
    child_id: 'c-1',
    guardian_id: 'g-1',
    nickname: 'Lina',
    avatar: null,
    language_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      child_profiles: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChildProfilesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ChildProfilesService>(ChildProfilesService);
  });

  it('create() legt das Kind mit der übergebenen guardianId an', async () => {
    prisma.child_profiles.create.mockResolvedValue(fakeChild);

    await service.create('g-1', { nickname: 'Lina', language_id: 1 });

    expect(prisma.child_profiles.create).toHaveBeenCalledWith({
      data: { guardian_id: 'g-1', nickname: 'Lina', avatar: undefined, language_id: 1 },
    });
  });

  it('findAllForGuardian() filtert nach guardian_id', async () => {
    prisma.child_profiles.findMany.mockResolvedValue([fakeChild]);

    await service.findAllForGuardian('g-1');

    expect(prisma.child_profiles.findMany).toHaveBeenCalledWith({ where: { guardian_id: 'g-1' } });
  });

  describe('findOne — Besitzer-Prüfung', () => {
    it('gibt das Kind zurück, wenn es dem anfragenden Guardian gehört', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);

      const result = await service.findOne('c-1', 'g-1');

      expect(result).toEqual(fakeChild);
    });

    it('wirft NotFoundException, wenn das Kind nicht existiert', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown', 'g-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wirft ForbiddenException, wenn das Kind einem anderen Guardian gehört', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);

      await expect(service.findOne('c-1', 'anderer-guardian')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('update / remove — nutzen dieselbe Besitzer-Prüfung', () => {
    it('update() schlägt für ein fremdes Kind fehl, bevor prisma.update aufgerufen wird', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);

      await expect(
        service.update('c-1', 'anderer-guardian', { nickname: 'Hack' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.child_profiles.update).not.toHaveBeenCalled();
    });

    it('remove() schlägt für ein fremdes Kind fehl, bevor prisma.delete aufgerufen wird', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);

      await expect(service.remove('c-1', 'anderer-guardian')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.child_profiles.delete).not.toHaveBeenCalled();
    });

    it('remove() löscht das Kind, wenn der Besitzer passt', async () => {
      prisma.child_profiles.findUnique.mockResolvedValue(fakeChild);
      prisma.child_profiles.delete.mockResolvedValue(fakeChild);

      const result = await service.remove('c-1', 'g-1');

      expect(prisma.child_profiles.delete).toHaveBeenCalledWith({ where: { child_id: 'c-1' } });
      expect(result).toEqual({ message: 'Kinderprofil gelöscht' });
    });
  });
});

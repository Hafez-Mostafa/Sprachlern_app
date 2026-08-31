import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { GuardiansService } from './guardians.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GuardiansService', () => {
  let service: GuardiansService;
  let prisma: any;

  const fakeGuardian = {
    guardian_id: 'g-1',
    email: 'test@example.com',
    password_hash: 'hashed',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      guardians: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardiansService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<GuardiansService>(GuardiansService);
  });

  describe('create', () => {
    it('legt ein neues Guardian-Konto an und entfernt password_hash aus der Antwort', async () => {
      prisma.guardians.findUnique.mockResolvedValue(null);
      prisma.guardians.create.mockResolvedValue(fakeGuardian);

      const result = await service.create({ email: 'test@example.com', password: 'geheim123' });

      expect(prisma.guardians.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password_hash');
      expect(result.email).toBe('test@example.com');
    });

    it('wirft ConflictException, wenn die E-Mail bereits existiert', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian);

      await expect(
        service.create({ email: 'test@example.com', password: 'geheim123' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.guardians.create).not.toHaveBeenCalled();
    });

    it('hasht das Passwort vor dem Speichern (Klartext wird nicht persistiert)', async () => {
      prisma.guardians.findUnique.mockResolvedValue(null);
      prisma.guardians.create.mockResolvedValue(fakeGuardian);

      await service.create({ email: 'test@example.com', password: 'geheim123' });

      const createArg = prisma.guardians.create.mock.calls[0][0];
      expect(createArg.data.password_hash).not.toBe('geheim123');
      expect(await bcrypt.compare('geheim123', createArg.data.password_hash)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('gibt den Guardian ohne password_hash zurück', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian);

      const result = await service.findOne('g-1');

      expect(result).not.toHaveProperty('password_hash');
      expect(result.guardian_id).toBe('g-1');
    });

    it('wirft NotFoundException, wenn kein Guardian existiert', async () => {
      prisma.guardians.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('hasht ein neues Passwort beim Aktualisieren', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian);
      prisma.guardians.update.mockResolvedValue(fakeGuardian);

      await service.update('g-1', { password: 'neuesPasswort123' });

      const updateArg = prisma.guardians.update.mock.calls[0][0];
      expect(updateArg.data.password_hash).toBeDefined();
      expect(updateArg.data.password_hash).not.toBe('neuesPasswort123');
    });

    it('aktualisiert nur die E-Mail, wenn kein Passwort angegeben ist', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian);
      prisma.guardians.update.mockResolvedValue(fakeGuardian);

      await service.update('g-1', { email: 'neu@example.com' });

      const updateArg = prisma.guardians.update.mock.calls[0][0];
      expect(updateArg.data).toEqual({ email: 'neu@example.com' });
    });
  });

  describe('remove', () => {
    it('löscht den Guardian nach Existenzprüfung', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian);
      prisma.guardians.delete.mockResolvedValue(fakeGuardian);

      const result = await service.remove('g-1');

      expect(prisma.guardians.delete).toHaveBeenCalledWith({ where: { guardian_id: 'g-1' } });
      expect(result).toEqual({ message: 'Konto gelöscht' });
    });
  });
});

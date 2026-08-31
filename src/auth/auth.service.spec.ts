import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const password = 'geheim123';
  let passwordHash: string;

  const fakeGuardian = () => ({
    guardian_id: 'g-1',
    email: 'guardian@example.com',
    password_hash: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const fakeAdmin = () => ({
    admin_id: 'a-1',
    email: 'admin@example.com',
    password_hash: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
  });

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    prisma = {
      guardians: { findUnique: jest.fn() },
      admins: { findUnique: jest.fn() },
    };
    jwtService = {
      signAsync: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue('signed-token'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login (Guardian)', () => {
    it('gibt bei korrekten Zugangsdaten ein Token und den Guardian ohne password_hash zurück', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian());

      const result = await service.login({
        email: 'guardian@example.com',
        password,
      });

      expect(result.access_token).toBe('signed-token');
      expect(result.guardian).not.toHaveProperty('password_hash');
    });

    it('wirft UnauthorizedException bei unbekannter E-Mail', async () => {
      prisma.guardians.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unbekannt@example.com', password }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('wirft UnauthorizedException bei falschem Passwort', async () => {
      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian());

      await expect(
        service.login({ email: 'guardian@example.com', password: 'falsch' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('meldet bei unbekannter E-Mail und falschem Passwort dieselbe Fehlermeldung (kein User Enumeration)', async () => {
      prisma.guardians.findUnique.mockResolvedValue(null);
      let messageUnknownEmail = '';
      try {
        await service.login({ email: 'unbekannt@example.com', password });
      } catch (e: any) {
        messageUnknownEmail = e.message;
      }

      prisma.guardians.findUnique.mockResolvedValue(fakeGuardian());
      let messageWrongPassword = '';
      try {
        await service.login({
          email: 'guardian@example.com',
          password: 'falsch',
        });
      } catch (e: any) {
        messageWrongPassword = e.message;
      }

      expect(messageUnknownEmail).toBe(messageWrongPassword);
    });
  });

  describe('adminLogin', () => {
    it('signiert das Admin-Token mit ADMIN_JWT_SECRET, nicht mit dem Standard-Secret', async () => {
      prisma.admins.findUnique.mockResolvedValue(fakeAdmin());
      process.env.ADMIN_JWT_SECRET = 'admin-secret-test';

      await service.adminLogin({ email: 'admin@example.com', password });

      const callOptions = jwtService.signAsync.mock.calls[0][1];
      expect(callOptions.secret).toBe('admin-secret-test');
    });

    it('gibt bei korrekten Zugangsdaten ein Token und den Admin ohne password_hash zurück', async () => {
      prisma.admins.findUnique.mockResolvedValue(fakeAdmin());

      const result = await service.adminLogin({
        email: 'admin@example.com',
        password,
      });

      expect(result.access_token).toBe('signed-token');
      expect(result.admin).not.toHaveProperty('password_hash');
    });

    it('wirft UnauthorizedException bei unbekannter Admin-E-Mail', async () => {
      prisma.admins.findUnique.mockResolvedValue(null);

      await expect(
        service.adminLogin({ email: 'unbekannt@example.com', password }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});

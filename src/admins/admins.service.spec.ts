import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminsService', () => {
  let service: AdminsService;
  let prisma: any;

  const fakeAdmin = {
    admin_id: 'a-1',
    email: 'admin@sprachlern-app.de',
    password_hash: 'hashed',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = { admins: { findUnique: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
  });

  it('gibt den Admin ohne password_hash zurück', async () => {
    prisma.admins.findUnique.mockResolvedValue(fakeAdmin);

    const result = await service.findOne('a-1');

    expect(result).not.toHaveProperty('password_hash');
    expect(result.admin_id).toBe('a-1');
  });

  it('wirft NotFoundException, wenn kein Admin existiert', async () => {
    prisma.admins.findUnique.mockResolvedValue(null);

    await expect(service.findOne('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});

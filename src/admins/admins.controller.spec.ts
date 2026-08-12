import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

describe('AdminsController', () => {
  let controller: AdminsController;
  let service: any;

  beforeEach(async () => {
    service = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminsController],
      providers: [{ provide: AdminsService, useValue: service }],
    }).compile();

    controller = module.get<AdminsController>(AdminsController);
  });

  it('getMe() liest admin_id aus dem (Admin-)Request und ruft findOne() auf', async () => {
    const req = { user: { admin_id: 'a-1' } } as any;
    await controller.getMe(req);
    expect(service.findOne).toHaveBeenCalledWith('a-1');
  });
});

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';

describe('GuardiansController', () => {
  let controller: GuardiansController;
  let service: any;

  const fakeReq = (guardianId: string) => ({ user: { guardian_id: guardianId } }) as any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardiansController],
      providers: [{ provide: GuardiansService, useValue: service }],
    }).compile();

    controller = module.get<GuardiansController>(GuardiansController);
  });

  it('sollte definiert sein', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegiert an guardiansService.create()', async () => {
    const dto = { email: 'a@b.com', password: 'geheim123' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('getMe() liest guardian_id aus dem Request und ruft findOne() auf', async () => {
    await controller.getMe(fakeReq('g-1'));
    expect(service.findOne).toHaveBeenCalledWith('g-1');
  });

  it('updateMe() ruft update() mit der eigenen guardian_id auf, nie mit einer fremden ID', async () => {
    const dto = { email: 'neu@b.com' };
    await controller.updateMe(fakeReq('g-1'), dto);
    expect(service.update).toHaveBeenCalledWith('g-1', dto);
  });

  it('removeMe() ruft remove() mit der eigenen guardian_id auf', async () => {
    await controller.removeMe(fakeReq('g-1'));
    expect(service.remove).toHaveBeenCalledWith('g-1');
  });
});

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ChildProfilesController } from './child-profiles.controller';
import { ChildProfilesService } from './child-profiles.service';

describe('ChildProfilesController (/guardians/me/children)', () => {
  let controller: ChildProfilesController;
  let service: any;

  const fakeReq = (guardianId: string) => ({ user: { guardian_id: guardianId } }) as any;

  beforeEach(async () => {
    service = { create: jest.fn(), findAllForGuardian: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildProfilesController],
      providers: [{ provide: ChildProfilesService, useValue: service }],
    }).compile();

    controller = module.get<ChildProfilesController>(ChildProfilesController);
  });

  it('create() übergibt die guardian_id aus dem Token, nicht aus dem Body', async () => {
    const dto = { nickname: 'Lina', language_id: 1 };
    await controller.create(fakeReq('g-1'), dto);
    expect(service.create).toHaveBeenCalledWith('g-1', dto);
  });

  it('findAll() ruft findAllForGuardian() mit der eigenen guardian_id auf', async () => {
    await controller.findAll(fakeReq('g-1'));
    expect(service.findAllForGuardian).toHaveBeenCalledWith('g-1');
  });
});

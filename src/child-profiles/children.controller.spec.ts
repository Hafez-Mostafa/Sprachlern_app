import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ChildrenController } from './children.controller';
import { ChildProfilesService } from './child-profiles.service';

describe('ChildrenController (/children/:childId)', () => {
  let controller: ChildrenController;
  let service: any;

  const fakeReq = (guardianId: string) => ({ user: { guardian_id: guardianId } }) as any;

  beforeEach(async () => {
    service = { findOne: jest.fn(), update: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildrenController],
      providers: [{ provide: ChildProfilesService, useValue: service }],
    }).compile();

    controller = module.get<ChildrenController>(ChildrenController);
  });

  it('findOne() übergibt childId und die eigene guardian_id für die Besitzer-Prüfung', async () => {
    await controller.findOne('c-1', fakeReq('g-1'));
    expect(service.findOne).toHaveBeenCalledWith('c-1', 'g-1');
  });

  it('update() übergibt childId, guardian_id und dto in dieser Reihenfolge', async () => {
    const dto = { nickname: 'Neu' };
    await controller.update('c-1', fakeReq('g-1'), dto);
    expect(service.update).toHaveBeenCalledWith('c-1', 'g-1', dto);
  });

  it('remove() übergibt childId und guardian_id', async () => {
    await controller.remove('c-1', fakeReq('g-1'));
    expect(service.remove).toHaveBeenCalledWith('c-1', 'g-1');
  });
});

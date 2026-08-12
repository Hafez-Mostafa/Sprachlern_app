import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ChildProgressController } from './child-progress.controller';
import { LearningProgressService } from './learning-progress.service';

describe('ChildProgressController (/children/:childId/progress)', () => {
  let controller: ChildProgressController;
  let service: any;

  const fakeReq = (guardianId: string) => ({ user: { guardian_id: guardianId } }) as any;

  beforeEach(async () => {
    service = { findForChild: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildProgressController],
      providers: [{ provide: LearningProgressService, useValue: service }],
    }).compile();

    controller = module.get<ChildProgressController>(ChildProgressController);
  });

  it('übergibt childId, die eigene guardian_id und den optionalen status-Filter', async () => {
    await controller.findForChild('c-1', fakeReq('g-1'), 'COMPLETED');
    expect(service.findForChild).toHaveBeenCalledWith('c-1', 'g-1', 'COMPLETED');
  });

  it('funktioniert auch ohne status-Filter', async () => {
    await controller.findForChild('c-1', fakeReq('g-1'), undefined);
    expect(service.findForChild).toHaveBeenCalledWith('c-1', 'g-1', undefined);
  });
});

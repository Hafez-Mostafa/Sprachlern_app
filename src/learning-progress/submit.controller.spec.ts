import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SubmitController } from './submit.controller';
import { LearningProgressService } from './learning-progress.service';

describe('SubmitController (/tasks/:taskId/submit)', () => {
  let controller: SubmitController;
  let service: any;

  const fakeReq = (guardianId: string) => ({ user: { guardian_id: guardianId } }) as any;

  beforeEach(async () => {
    service = { submitAnswer: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmitController],
      providers: [{ provide: LearningProgressService, useValue: service }],
    }).compile();

    controller = module.get<SubmitController>(SubmitController);
  });

  it('übergibt taskId, die eigene guardian_id (nicht die des Kindes) und das DTO', async () => {
    const dto = { child_id: 'c-1', answer: 'صغير' };
    await controller.submit('t-1', fakeReq('g-1'), dto);
    expect(service.submitAnswer).toHaveBeenCalledWith('t-1', 'g-1', dto);
  });
});

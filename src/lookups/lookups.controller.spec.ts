import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

describe('LookupsController', () => {
  let controller: LookupsController;
  let service: any;

  beforeEach(async () => {
    service = {
      getLanguages: jest.fn(),
      getExerciseTypes: jest.fn(),
      getProgressStatuses: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupsController],
      providers: [{ provide: LookupsService, useValue: service }],
    }).compile();

    controller = module.get<LookupsController>(LookupsController);
  });

  it('getLanguages() delegiert an lookupsService.getLanguages()', async () => {
    await controller.getLanguages();
    expect(service.getLanguages).toHaveBeenCalled();
  });

  it('getExerciseTypes() delegiert an lookupsService.getExerciseTypes()', async () => {
    await controller.getExerciseTypes();
    expect(service.getExerciseTypes).toHaveBeenCalled();
  });

  it('getProgressStatuses() delegiert an lookupsService.getProgressStatuses()', async () => {
    await controller.getProgressStatuses();
    expect(service.getProgressStatuses).toHaveBeenCalled();
  });
});

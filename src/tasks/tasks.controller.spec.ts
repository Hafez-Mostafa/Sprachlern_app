import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController (/exercises/:exerciseId/tasks)', () => {
  let controller: TasksController;
  let service: any;

  beforeEach(async () => {
    service = { create: jest.fn(), findAllForExercise: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: service }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('findAll() übergibt die exerciseId aus dem Pfad', async () => {
    await controller.findAll('e-1');
    expect(service.findAllForExercise).toHaveBeenCalledWith('e-1');
  });

  it('create() übergibt exerciseId und dto', async () => {
    const dto = { question: 'Q', correct_answer: 'A' };
    await controller.create('e-1', dto);
    expect(service.create).toHaveBeenCalledWith('e-1', dto);
  });
});

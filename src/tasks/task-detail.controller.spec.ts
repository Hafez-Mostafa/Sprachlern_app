import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskDetailController } from './task-detail.controller';
import { TasksService } from './tasks.service';

describe('TaskDetailController (/tasks/:taskId)', () => {
  let controller: TaskDetailController;
  let service: any;

  beforeEach(async () => {
    service = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findWordsForTask: jest.fn(),
      assignWord: jest.fn(),
      assignWordsBulk: jest.fn(),
      removeWordFromTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskDetailController],
      providers: [{ provide: TasksService, useValue: service }],
    }).compile();

    controller = module.get<TaskDetailController>(TaskDetailController);
  });

  it('sollte definiert sein', () => {
    expect(controller).toBeDefined();
  });

  it('findOne() delegiert mit taskId', async () => {
    await controller.findOne('t-1');
    expect(service.findOne).toHaveBeenCalledWith('t-1');
  });

  it('update() delegiert mit taskId und dto', async () => {
    const dto = { question: 'Neu' };
    await controller.update('t-1', dto);
    expect(service.update).toHaveBeenCalledWith('t-1', dto);
  });

  it('remove() delegiert mit taskId', async () => {
    await controller.remove('t-1');
    expect(service.remove).toHaveBeenCalledWith('t-1');
  });

  it('findWords() delegiert mit taskId', async () => {
    await controller.findWords('t-1');
    expect(service.findWordsForTask).toHaveBeenCalledWith('t-1');
  });

  it('assignWord() zerlegt das DTO in word_id und position', async () => {
    await controller.assignWord('t-1', { word_id: 'w-1', position: 2 });
    expect(service.assignWord).toHaveBeenCalledWith('t-1', 'w-1', 2);
  });

  it('assignWordsBulk() übergibt taskId und die words-Liste', async () => {
    const words = [{ word_id: 'w-1', position: 0 }, { word_id: 'w-2', position: 1 }];
    await controller.assignWordsBulk('t-1', { words });
    expect(service.assignWordsBulk).toHaveBeenCalledWith('t-1', words);
  });

  it('removeWord() delegiert mit taskId und wordId', async () => {
    await controller.removeWord('t-1', 'w-1');
    expect(service.removeWordFromTask).toHaveBeenCalledWith('t-1', 'w-1');
  });
});

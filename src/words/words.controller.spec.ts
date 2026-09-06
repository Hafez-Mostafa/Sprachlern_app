import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WordsController } from './words.controller';
import { WordsService } from './words.service';

describe('WordsController', () => {
  let controller: WordsController;
  let service: any;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setAudio: jest.fn(),
      removeAudio: jest.fn(),
      uploadAudio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WordsController],
      providers: [{ provide: WordsService, useValue: service }],
    }).compile();

    controller = module.get<WordsController>(WordsController);
  });

  it('findAll() wandelt language_id in eine Zahl um und reicht search durch', async () => {
    await controller.findAll('2', 'apf');
    expect(service.findAll).toHaveBeenCalledWith({
      language_id: 2,
      search: 'apf',
    });
  });

  it('setAudio() delegiert mit id und dto', async () => {
    const dto = { url: 'https://example.com/x.mp3' };
    await controller.setAudio('w-1', dto);
    expect(service.setAudio).toHaveBeenCalledWith('w-1', dto);
  });

  it('removeAudio() delegiert mit id', async () => {
    await controller.removeAudio('w-1');
    expect(service.removeAudio).toHaveBeenCalledWith('w-1');
  });
});

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WordsController } from './words.controller';
import { WordsService } from './words.service';

describe('WordsController', () => {
  let controller: WordsController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      createMany: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setImage: jest.fn(),
      removeImage: jest.fn(),
      setAudio: jest.fn(),
      removeAudio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WordsController],
      providers: [{ provide: WordsService, useValue: service }],
    }).compile();

    controller = module.get<WordsController>(WordsController);
  });

  it('findAll() wandelt language_id in eine Zahl um und reicht search durch', async () => {
    await controller.findAll('2', 'apf');
    expect(service.findAll).toHaveBeenCalledWith({ language_id: 2, search: 'apf' });
  });

  it('create() delegiert an wordsService.create()', async () => {
    const dto = { text: 'Apfel', language_id: 1 };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('createMany() entpackt dto.words und delegiert an createMany()', async () => {
    const words = [{ text: 'Apfel', language_id: 1 }, { text: 'Banane', language_id: 1 }];
    await controller.createMany({ words });
    expect(service.createMany).toHaveBeenCalledWith(words);
  });

  it('setImage() delegiert mit id und dto (PUT-Semantik: setzen/ersetzen)', async () => {
    const dto = { url: 'https://example.com/x.png' };
    await controller.setImage('w-1', dto);
    expect(service.setImage).toHaveBeenCalledWith('w-1', dto);
  });

  it('removeImage() delegiert mit id', async () => {
    await controller.removeImage('w-1');
    expect(service.removeImage).toHaveBeenCalledWith('w-1');
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

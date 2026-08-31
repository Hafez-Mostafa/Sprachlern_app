import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

describe('ExercisesController', () => {
  let controller: ExercisesController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [{ provide: ExercisesService, useValue: service }],
    }).compile();

    controller = module.get<ExercisesController>(ExercisesController);
  });

  it('findAll() wandelt Query-Strings korrekt in number/boolean um', async () => {
    await controller.findAll('2', '1', 'true');

    expect(service.findAll).toHaveBeenCalledWith({
      language_id: 2,
      exercise_type_id: 1,
      is_active: true,
    });
  });

  it('findAll() übergibt undefined für nicht gesetzte Query-Parameter', async () => {
    await controller.findAll(undefined, undefined, undefined);

    expect(service.findAll).toHaveBeenCalledWith({
      language_id: undefined,
      exercise_type_id: undefined,
      is_active: undefined,
    });
  });

  it('create() delegiert an exercisesService.create()', async () => {
    const dto = { title: 'Test', language_id: 1, exercise_type_id: 1 };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update() delegiert mit id und dto', async () => {
    const dto = { title: 'Neu' };
    await controller.update('e-1', dto);
    expect(service.update).toHaveBeenCalledWith('e-1', dto);
  });

  it('remove() delegiert mit id', async () => {
    await controller.remove('e-1');
    expect(service.remove).toHaveBeenCalledWith('e-1');
  });
});

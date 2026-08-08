import { Test, TestingModule } from '@nestjs/testing';
import { ChildProfilesController } from './child-profiles.controller';
import { ChildProfilesService } from './child-profiles.service';

describe('ChildProfilesController', () => {
  let controller: ChildProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildProfilesController],
      providers: [ChildProfilesService],
    }).compile();

    controller = module.get<ChildProfilesController>(ChildProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

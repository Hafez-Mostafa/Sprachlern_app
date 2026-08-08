import { Test, TestingModule } from '@nestjs/testing';
import { ChildProfilesService } from './child-profiles.service';

describe('ChildProfilesService', () => {
  let service: ChildProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChildProfilesService],
    }).compile();

    service = module.get<ChildProfilesService>(ChildProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

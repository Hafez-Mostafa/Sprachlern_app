import { Module } from '@nestjs/common';
import { ChildProfilesService } from './child-profiles.service';
import { ChildProfilesController } from './child-profiles.controller';
import { ChildrenController } from './children.controller';

@Module({
  controllers: [ChildProfilesController, ChildrenController],
  providers: [ChildProfilesService],
})
export class ChildProfilesModule {}

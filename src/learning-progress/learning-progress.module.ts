import { Module } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service';
import { ChildProgressController } from './child-progress.controller';
import { SubmitController } from './submit.controller';

@Module({
  controllers: [ChildProgressController, SubmitController],
  providers: [LearningProgressService],
})
export class LearningProgressModule {}

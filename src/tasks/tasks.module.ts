import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskDetailController } from './task-detail.controller';

@Module({
  controllers: [TasksController, TaskDetailController],
  providers: [TasksService],
})
export class TasksModule {}
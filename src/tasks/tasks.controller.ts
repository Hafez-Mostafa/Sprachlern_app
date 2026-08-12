import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('exercises/:exerciseId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Param('exerciseId') exerciseId: string) {
    return this.tasksService.findAllForExercise(exerciseId);
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Param('exerciseId') exerciseId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(exerciseId, dto);
  }
}
  import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignWordDto } from './dto/assign-word.dto';
import { BulkAssignWordsDto } from './dto/bulk-assign-words.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('tasks')
export class TaskDetailController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':taskId')
  findOne(@Param('taskId') taskId: string) {
    return this.tasksService.findOne(taskId);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':taskId')
  update(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(taskId, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':taskId')
  remove(@Param('taskId') taskId: string) {
    return this.tasksService.remove(taskId);
  }

  // --- Wort-Zuordnung ---

  @Get(':taskId/words')
  findWords(@Param('taskId') taskId: string) {
    return this.tasksService.findWordsForTask(taskId);
  }

  @UseGuards(AdminJwtGuard)
  @Post(':taskId/words')
  assignWord(@Param('taskId') taskId: string, @Body() dto: AssignWordDto) {
    return this.tasksService.assignWord(taskId, dto.word_id, dto.position);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':taskId/words/:wordId')
  removeWord(@Param('taskId') taskId: string, @Param('wordId') wordId: string) {
    return this.tasksService.removeWordFromTask(taskId, wordId);
  }

  @UseGuards(AdminJwtGuard)
  @Post(':taskId/words/bulk')
  assignWordsBulk(
    @Param('taskId') taskId: string,
    @Body() dto: BulkAssignWordsDto,
  ) {
    return this.tasksService.assignWordsBulk(taskId, dto.words);
  }
}

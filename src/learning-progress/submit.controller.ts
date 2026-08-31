import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { LearningProgressService } from './learning-progress.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId')
export class SubmitController {
  constructor(
    private readonly learningProgressService: LearningProgressService,
  ) {}

  @Post('submit')
  submit(
    @Param('taskId') taskId: string,
    @Req() req: Request,
    @Body() dto: SubmitAnswerDto,
  ) {
    const user = req.user as { guardian_id: string };
    return this.learningProgressService.submitAnswer(
      taskId,
      user.guardian_id,
      dto,
    );
  }
}

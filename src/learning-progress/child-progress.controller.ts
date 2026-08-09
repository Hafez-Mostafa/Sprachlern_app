import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { LearningProgressService } from './learning-progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('children/:childId/progress')
export class ChildProgressController {
  constructor(
    private readonly learningProgressService: LearningProgressService,
  ) {}

  @Get()
  findForChild(
    @Param('childId') childId: string,
    @Req() req: Request,
    @Query('status') status?: string,
  ) {
    const user = req.user as { guardian_id: string };
    return this.learningProgressService.findForChild(
      childId,
      user.guardian_id,
      status,
    );
  }
}

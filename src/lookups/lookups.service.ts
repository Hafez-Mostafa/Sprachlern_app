import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLanguages() {
    return this.prisma.app_languages.findMany({
      orderBy: { app_language_id: 'asc' },
    });
  }

  async getExerciseTypes() {
    return this.prisma.exercise_types.findMany({
      orderBy: { exercise_type_id: 'asc' },
    });
  }

  async getProgressStatuses() {
    return this.prisma.progress_status.findMany({
      orderBy: { progress_status_id: 'asc' },
    });
  }
}

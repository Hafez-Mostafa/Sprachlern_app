import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLanguages() {
    const rows = await this.prisma.app_languages.findMany({
      orderBy: { app_language_id: 'asc' },
    });
    // Auf LookupItem-Schema ({ id, name }) mappen — die Spec dokumentiert
    // generische Feldnamen, Prisma liefert die tabellenspezifischen PKs.
    return rows.map((r) => ({ id: r.app_language_id, name: r.name }));
  }

  async getExerciseTypes() {
    const rows = await this.prisma.exercise_types.findMany({
      orderBy: { exercise_type_id: 'asc' },
    });
    return rows.map((r) => ({ id: r.exercise_type_id, name: r.name }));
  }

  async getProgressStatuses() {
    const rows = await this.prisma.progress_status.findMany({
      orderBy: { progress_status_id: 'asc' },
    });
    return rows.map((r) => ({ id: r.progress_status_id, name: r.name }));
  }
}

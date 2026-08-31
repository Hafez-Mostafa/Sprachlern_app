import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class LearningProgressService {
  constructor(private readonly prisma: PrismaService) {}

  // Prüft, dass das Kind existiert UND dem anfragenden Guardian gehört
  private async assertChildBelongsToGuardian(
    childId: string,
    guardianId: string,
  ) {
    const child = await this.prisma.child_profiles.findUnique({
      where: { child_id: childId },
    });
    if (!child) {
      throw new NotFoundException(`Kind mit ID ${childId} nicht gefunden`);
    }
    if (child.guardian_id !== guardianId) {
      throw new ForbiddenException('Kein Zugriff auf dieses Kinderprofil');
    }
  }

  async findForChild(childId: string, guardianId: string, statusName?: string) {
    await this.assertChildBelongsToGuardian(childId, guardianId);

    const rows = await this.prisma.learning_progress.findMany({
      where: {
        child_id: childId,
        ...(statusName && { progress_status: { name: statusName } }),
      },
      include: { progress_status: true },
    });

    return rows.map((r) => this.toProgressDto(r));
  }

  // Kernstück: Antwort serverseitig bewerten und Fortschritt speichern/aktualisieren
  async submitAnswer(taskId: string, guardianId: string, dto: SubmitAnswerDto) {
    await this.assertChildBelongsToGuardian(dto.child_id, guardianId);

    const task = await this.prisma.tasks.findUnique({
      where: { task_id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Aufgabe mit ID ${taskId} nicht gefunden`);
    }

    // Serverseitiger Vergleich — der Client hat keinen Einfluss auf dieses Ergebnis
    const isCorrect = task.correct_answer.trim() === dto.answer.trim();

    const statusName = isCorrect ? 'COMPLETED' : 'IN_PROGRESS';
    const status = await this.prisma.progress_status.findUnique({
      where: { name: statusName },
    });
    if (!status) {
      // Sollte nur passieren, wenn die Stammdaten manuell verändert wurden
      throw new NotFoundException(
        `Status "${statusName}" nicht in progress_status gefunden`,
      );
    }

    const score = isCorrect ? 100 : 0;

    // upsert: legt neuen Fortschritt an, oder aktualisiert bestehenden
    // (uq_progress_child_task erlaubt nur einen Eintrag pro Kind+Aufgabe)
    const progress = await this.prisma.learning_progress.upsert({
      where: {
        child_id_task_id: { child_id: dto.child_id, task_id: taskId },
      },
      create: {
        child_id: dto.child_id,
        task_id: taskId,
        status_id: status.progress_status_id,
        score,
        completed_at: isCorrect ? new Date() : null,
      },
      update: {
        status_id: status.progress_status_id,
        score,
        completed_at: isCorrect ? new Date() : null,
      },
      include: { progress_status: true },
    });

    return this.toProgressDto(progress);
  }

  // Auf das LearningProgress-Schema laut Spec mappen: "status" (LookupItem)
  // statt des rohen Prisma-Relationsnamens "progress_status".
  private toProgressDto(progress: {
    progress_id: string;
    child_id: string;
    task_id: string;
    score: number | null;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
    progress_status: { progress_status_id: number; name: string };
  }) {
    const { progress_status, ...rest } = progress;
    return {
      ...rest,
      status: {
        id: progress_status.progress_status_id,
        name: progress_status.name,
      },
    };
  }
}

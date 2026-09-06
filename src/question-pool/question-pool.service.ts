import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

// Der komplette Fragenpool ist admin-only (siehe QuestionPoolController) -
// anders als z. B. WordsModule ist hier NICHTS öffentlich lesbar, weil
// jeder Eintrag die Musterlösung (correct_answer) enthält.
@Injectable()
export class QuestionPoolService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(languageId?: number) {
    return this.prisma.question_pool.findMany({
      where: languageId ? { language_id: languageId } : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question_pool.findUnique({
      where: { question_id: id },
    });
    if (!question) {
      throw new NotFoundException(`Frage mit ID ${id} nicht gefunden`);
    }
    return question;
  }

  create(dto: CreateQuestionDto) {
    return this.prisma.question_pool.create({ data: dto });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);
    return this.prisma.question_pool.update({
      where: { question_id: id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const usageCount = await this.prisma.tasks.count({
      where: { question_id: id },
    });
    if (usageCount > 0) {
      // Passend zu fk_task_question (ON DELETE RESTRICT) - hier schon
      // vorab mit einer klaren 409 statt eines rohen DB-Fehlers abfangen.
      throw new ConflictException(
        `Frage wird noch in ${usageCount} Task(s) verwendet und kann nicht gelöscht werden`,
      );
    }
    await this.prisma.question_pool.delete({ where: { question_id: id } });
    return { message: 'Frage gelöscht' };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(exerciseId: string, dto: CreateTaskDto) {
    return this.prisma.tasks.create({
      data: {
        exercise_id: exerciseId,
        question: dto.question,
        correct_answer: dto.correct_answer,
        position: dto.position ?? 0,
      },
    });
  }

  async findAllForExercise(exerciseId: string) {
    return this.prisma.tasks.findMany({
      where: { exercise_id: exerciseId },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(taskId: string) {
    const task = await this.prisma.tasks.findUnique({
      where: { task_id: taskId },
      include: {
        task_words: {
          orderBy: { position: 'asc' },
          include: { words: true },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Aufgabe mit ID ${taskId} nicht gefunden`);
    }

    // Mapping auf das in openapi.yaml dokumentierte TaskDetail-Schema:
    // { ...Task, words: [{ word, position }] } statt der rohen
    // Prisma-Relation "task_words" mit verschachteltem "words"-Feld.
    const { task_words, ...taskFields } = task;
    return {
      ...taskFields,
      words: task_words.map((tw) => ({
        word: tw.words,
        position: tw.position,
      })),
    };
  }

  async update(taskId: string, dto: UpdateTaskDto) {
    await this.findOne(taskId);
    return this.prisma.tasks.update({
      where: { task_id: taskId },
      data: dto,
    });
  }

  async remove(taskId: string) {
    await this.findOne(taskId);
    await this.prisma.tasks.delete({ where: { task_id: taskId } });
    return { message: 'Aufgabe gelöscht' };
  }

  // --- Wort-Zuordnung (task_words) ---

  async assignWord(taskId: string, wordId: string, position: number) {
    await this.findOne(taskId); // stellt sicher, dass die Aufgabe existiert

    try {
      return await this.prisma.task_words.create({
        data: { task_id: taskId, word_id: wordId, position },
      });
    } catch (error: any) {
      // P2002: Zuordnung existiert schon (zusammengesetzter Primärschlüssel task_id+word_id)
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Wort ist dieser Aufgabe bereits zugeordnet',
        );
      }
      // P2003: word_id existiert nicht in der words-Tabelle
      if (error.code === 'P2003') {
        throw new NotFoundException(`Wort mit ID ${wordId} nicht gefunden`);
      }
      throw error;
    }
  }

  async findWordsForTask(taskId: string) {
    await this.findOne(taskId);
    const entries = await this.prisma.task_words.findMany({
      where: { task_id: taskId },
      orderBy: { position: 'asc' },
      include: { words: true },
    });

    // Fix: gleiches Mapping wie in findOne() - die Spec erwartet
    // WordTaskEntry: { word: Word, position: number } (Singular "word"),
    // Prisma liefert aber die rohe Relation "words" (Plural). Ohne dieses
    // Mapping war entry.word im Frontend immer undefined (leerer Text,
    // kein Bild, X-Button lief mit wordId=undefined ins Leere).
    return entries.map((entry) => ({
      word: entry.words,
      position: entry.position,
    }));
  }

  async removeWordFromTask(taskId: string, wordId: string) {
    const existing = await this.prisma.task_words.findUnique({
      where: { task_id_word_id: { task_id: taskId, word_id: wordId } },
    });
    if (!existing) {
      throw new NotFoundException('Zuordnung nicht gefunden');
    }
    await this.prisma.task_words.delete({
      where: { task_id_word_id: { task_id: taskId, word_id: wordId } },
    });
    return { message: 'Zuordnung entfernt' };
  }

  async assignWordsBulk(
    taskId: string,
    assignments: { word_id: string; position: number }[],
  ) {
    await this.findOne(taskId); // stellt sicher, dass die Aufgabe existiert

    // Hinweis: createManyAndReturn liefert ebenfalls die rohe Prisma-Struktur
    // (kein "word"/"words"-Mapping). Aktuell von keinem Frontend-Code genutzt,
    // daher kein akuter Fix - falls der Bulk-Endpunkt später Ergebnisse direkt
    // anzeigen soll, braucht es hier dasselbe Mapping wie oben.
    return this.prisma.task_words.createManyAndReturn({
      data: assignments.map((a) => ({
        task_id: taskId,
        word_id: a.word_id,
        position: a.position,
      })),
      skipDuplicates: true,
    });
  }
}

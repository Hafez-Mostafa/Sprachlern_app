import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
 constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateExerciseDto) {
      return this.prisma.exercises.create({
        data: {
          title: dto.title,
          language_id: dto.language_id,
          exercise_type_id: dto.exercise_type_id,
          is_active: dto.is_active ?? true,
        },
      });
    }

    async findAll(filters: {
      language_id?: number;
      exercise_type_id?: number;
      is_active?: boolean;
    }) {
      const exercises = await this.prisma.exercises.findMany({
        where: {
          ...(filters.language_id !== undefined && {
            language_id: filters.language_id,
          }),
          ...(filters.exercise_type_id !== undefined && {
            exercise_type_id: filters.exercise_type_id,
          }),
          ...(filters.is_active !== undefined && {
            is_active: filters.is_active,
          }),
        },
        include: {
          tasks: { select: { _count: { select: { task_words: true } } } },
        },
      });
      return exercises.map((e) => this.toPublicExerciseDto(e));
    }

    async findOne(id: string) {
      const exercise = await this.prisma.exercises.findUnique({
        where: { exercise_id: id },
        include: {
          tasks: { select: { _count: { select: { task_words: true } } } },
        },
      });
      if (!exercise) {
        throw new NotFoundException(`Übung mit ID ${id} nicht gefunden`);
      }
      return this.toPublicExerciseDto(exercise);
    }

    // Anzahl der Aufgaben, die tatsächlich mind. ein verknüpftes Wort haben
    // (also spielbar sind) - damit kann das Kind-Frontend Übungen ohne
    // spielbaren Inhalt komplett ausblenden, statt erst hineinzunavigieren
    // und dann "keine Aufgaben vorhanden" zu sehen. Gleiches Prinzip wie
    // Task.word_count, nur eine Ebene höher.
    private toPublicExerciseDto(exercise: {
      tasks: { _count: { task_words: number } }[];
      [key: string]: unknown;
    }) {
      const { tasks, ...rest } = exercise;
      return {
        ...rest,
        playable_task_count: tasks.filter((t) => t._count.task_words > 0)
          .length,
      };
    }

    async update(id: string, dto: UpdateExerciseDto) {
      await this.findOne(id);
      return this.prisma.exercises.update({
        where: { exercise_id: id },
        data: {
          ...dto,
          updated_at: new Date(),
        },
      });
    }

    async remove(id: string) {
      await this.findOne(id);
      await this.prisma.exercises.delete({ where: { exercise_id: id } });
      return { message: 'Übung gelöscht' };
    }
}





                                                                                  Projekt Export

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
    return this.prisma.exercises.findMany({
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
    });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercises.findUnique({
      where: { exercise_id: id },
    });
    if (!exercise) {
      throw new NotFoundException(`Übung mit ID ${id} nicht gefunden`);
    }
    return exercise;
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

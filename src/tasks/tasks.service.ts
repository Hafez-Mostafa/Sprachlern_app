import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
 constructor(private readonly prisma: PrismaService) {}

 // Stellt sicher, dass die gewählte Pool-Frage a) existiert und b) in der
 // gleichen Sprache wie die Exercise ist, unter der die Aufgabe hängt -
 // sonst könnte ein DE-Exercise versehentlich eine AR-Frage bekommen.
 private async assertQuestionMatchesExerciseLanguage(
   questionId: string,
   exerciseId: string,
 ) {
   const [question, exercise] = await Promise.all([
     this.prisma.question_pool.findUnique({ where: { question_id: questionId } }),
     this.prisma.exercises.findUnique({ where: { exercise_id: exerciseId } }),
   ]);

   if (!question) {
     throw new NotFoundException(`Frage mit ID ${questionId} nicht im Fragenpool gefunden`);
   }
   if (!exercise) {
     throw new NotFoundException(`Exercise mit ID ${exerciseId} nicht gefunden`);
   }
   if (question.language_id !== exercise.language_id) {
     throw new BadRequestException(
       'Die gewählte Frage gehört zu einer anderen Sprache als die Exercise',
     );
   }
 }

 async create(exerciseId: string, dto: CreateTaskDto) {
   await this.assertQuestionMatchesExerciseLanguage(dto.question_id, exerciseId);

   const task = await this.prisma.tasks.create({
     data: {
       exercise_id: exerciseId,
       question_id: dto.question_id,
       position: dto.position ?? 0,
     },
   });
   return this.findOne(task.task_id);
 }

 async findAllForExercise(exerciseId: string) {
   const tasks = await this.prisma.tasks.findMany({
     where: { exercise_id: exerciseId },
     orderBy: { position: 'asc' },
     include: { question_pool: { select: { question: true, language_id: true } } },
   });
   // Öffentliche Liste: NUR die Frage, NIE correct_answer (das lebt exklusiv
   // im admin-only Fragenpool-Endpoint).
   return tasks.map((t) => this.toPublicTaskDto(t));
 }

 async findOne(taskId: string) {
  const task = await this.prisma.tasks.findUnique({
    where: { task_id: taskId },
    include: {
      question_pool: { select: { question: true, language_id: true } },
      task_words: {
        orderBy: { position: 'asc' },
        include: { words: true },
      },
    },
  });
  if (!task) {
    throw new NotFoundException(`Aufgabe mit ID ${taskId} nicht gefunden`);
  }

     // Mapping auf das TaskDetail-Schema. Bewusst KEIN correct_answer im
     // öffentlichen Response — siehe Audit-Finding C3: das war vorher direkt
     // hier im rohen Prisma-Objekt enthalten und wurde 1:1 an den Client
     // (inkl. Frontend-ExercisePage) durchgereicht.
     return {
       ...this.toPublicTaskDto(task),
       words: task.task_words.map((tw) => ({
         word: tw.words,
         position: tw.position,
       })),
     };
 }

 private toPublicTaskDto(task: {
   task_id: string;
   exercise_id: string;
   question_id: string;
   position: number;
   created_at: Date;
   question_pool: { question: string; language_id: number };
 }) {
   return {
     task_id: task.task_id,
     exercise_id: task.exercise_id,
     question_id: task.question_id,
     question: task.question_pool.question,
     position: task.position,
     created_at: task.created_at,
   };
 }

 async update(taskId: string, dto: UpdateTaskDto) {
   const existing = await this.prisma.tasks.findUnique({ where: { task_id: taskId } });
   if (!existing) {
     throw new NotFoundException(`Aufgabe mit ID ${taskId} nicht gefunden`);
   }

   if (dto.question_id) {
     await this.assertQuestionMatchesExerciseLanguage(dto.question_id, existing.exercise_id);
   }

   await this.prisma.tasks.update({
     where: { task_id: taskId },
     data: {
       question_id: dto.question_id,
       position: dto.position,
     },
   });
   return this.findOne(taskId);
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
 ){
  await this.findOne(taskId); // stellt sicher, dass die Aufgabe existiert

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

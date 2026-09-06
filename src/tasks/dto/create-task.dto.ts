import { IsUUID, IsOptional, IsInt } from 'class-validator';

// Die Aufgabe selbst enthält keinen Frage-/Antworttext mehr - der Admin
// wählt eine bestehende Frage aus dem Fragenpool aus (siehe
// QuestionPoolModule). TasksService prüft zusätzlich, dass die gewählte
// Frage zur Sprache der Exercise passt.
export class CreateTaskDto {
  @IsUUID()
  question_id!: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

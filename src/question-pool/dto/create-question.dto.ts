import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsInt()
  language_id!: number;

  @IsString()
  @MinLength(1)
  question!: string;

  // Die Antwort wird bewusst schon HIER, beim Anlegen der Frage, gesetzt -
  // nicht erst beim Task. Ein Task wählt später nur noch eine bestehende
  // Frage aus dem Pool aus, siehe TasksModule/CreateTaskDto (question_id).
  @IsString()
  @MinLength(1)
  correct_answer!: string;
}

import { IsString, MinLength } from 'class-validator';

// Sprache und Concept-Zugehörigkeit eines Wortes stehen bei der Erstellung
// fest (siehe ConceptsService.create()/addTranslation()) und sind hier
// bewusst NICHT editierbar - nur der Text einer bestehenden Sprachvariante
// kann korrigiert werden.
export class UpdateWordDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

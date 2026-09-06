import { IsInt, IsString, MinLength } from 'class-validator';

// Ein Text-Eintrag für genau eine Sprache innerhalb eines Concepts.
// Audio wird bewusst NICHT hier mitgegeben (Binärdatei) - Audio wird nach
// dem Anlegen des Concepts pro Wort über PUT /words/:id/audio(/upload)
// nachgereicht, genau wie bisher.
export class ConceptTranslationDto {
  @IsInt()
  language_id!: number;

  @IsString()
  @MinLength(1)
  text!: string;
}

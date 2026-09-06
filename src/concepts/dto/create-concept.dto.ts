import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { ConceptTranslationDto } from './concept-translation.dto';

// Struktur-Validierung (mind. 1 Eintrag, jeder Eintrag valide) passiert
// hier. Die eigentliche "Zwang zu ALLEN Sprachen"-Regel kann nicht rein
// deklarativ (DTO-Ebene) geprüft werden, da sie von den aktuell in der DB
// konfigurierten app_languages abhängt - das prüft ConceptsService.create()
// explizit und wirft sonst 400 mit der Liste der fehlenden Sprachen.
export class CreateConceptDto {
  @ValidateNested({ each: true })
  @Type(() => ConceptTranslationDto)
  @ArrayMinSize(1)
  translations!: ConceptTranslationDto[];
}

import { IsUrl, IsOptional, IsString, IsInt } from 'class-validator';

// Identisch zum bisherigen words/image-upsert.dto.ts, nur jetzt am Concept
// statt am einzelnen Wort - das Bild ist ja jetzt sprachübergreifend.
export class ConceptImageUpsertDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  public_id?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsInt()
  bytes?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

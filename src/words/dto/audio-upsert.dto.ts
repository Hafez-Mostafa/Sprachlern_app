import { IsUrl, IsOptional, IsInt } from 'class-validator';

export class AudioUpsertDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsInt()
  duration_ms?: number;
}

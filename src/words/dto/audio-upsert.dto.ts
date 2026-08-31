import { IsUrl, IsOptional, IsInt, IsString } from 'class-validator';

export class AudioUpsertDto {
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
  @IsInt()
  duration_ms?: number;
}

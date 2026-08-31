import { IsUrl, IsOptional, IsString, IsInt } from 'class-validator';

export class ImageUpsertDto {
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

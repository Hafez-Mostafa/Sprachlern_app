import { IsUrl, IsOptional, IsString } from 'class-validator';

export class ImageUpsertDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

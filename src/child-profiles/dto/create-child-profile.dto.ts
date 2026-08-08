import { IsString, IsInt, IsOptional, MinLength } from 'class-validator';

export class CreateChildProfileDto {
  @IsString()
  @MinLength(1)
  nickname!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsInt()
  language_id!: number;
}

import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  question: string;

  @IsString()
  @MinLength(1)
  correct_answer: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
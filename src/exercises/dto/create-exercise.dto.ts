import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsInt()
  language_id!: number;

  @IsInt()
  exercise_type_id!: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

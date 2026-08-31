import { IsString, IsInt, MinLength } from 'class-validator';

export class CreateWordDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsInt()
  language_id!: number;
}

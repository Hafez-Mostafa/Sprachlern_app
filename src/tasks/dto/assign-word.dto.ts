import { IsUUID, IsInt } from 'class-validator';

export class AssignWordDto {
  @IsUUID()
  word_id!: string;

  @IsInt()
  position!: number;
}

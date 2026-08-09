import { IsUUID, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  child_id!: string;

  @IsString()
  answer!: string;
}

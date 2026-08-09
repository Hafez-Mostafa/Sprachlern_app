import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { AssignWordDto } from './assign-word.dto';

export class BulkAssignWordsDto {
  @ValidateNested({ each: true })
  @Type(() => AssignWordDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  words!: AssignWordDto[];
}

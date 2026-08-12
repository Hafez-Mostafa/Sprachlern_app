import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CreateWordDto } from './create-word.dto';

export class BulkCreateWordsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateWordDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  words!: CreateWordDto[];
}

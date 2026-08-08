import { PartialType } from '@nestjs/mapped-types';
import { CreateChildProfileDto } from './create-child-profile.dto';

export class UpdateChildProfileDto extends PartialType(CreateChildProfileDto) {}

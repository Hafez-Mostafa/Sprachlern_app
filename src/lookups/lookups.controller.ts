import { Controller, Get } from '@nestjs/common';
import { LookupsService } from './lookups.service';

@Controller()
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('languages')
  getLanguages() {
    return this.lookupsService.getLanguages();
  }

  @Get('exercise-types')
  getExerciseTypes() {
    return this.lookupsService.getExerciseTypes();
  }

  @Get('progress-statuses')
  getProgressStatuses() {
    return this.lookupsService.getProgressStatuses();
  }
}

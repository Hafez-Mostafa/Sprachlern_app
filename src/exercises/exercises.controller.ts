import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // Öffentlich — jeder darf Übungen durchsuchen, kein Login nötig
  @Get()
  findAll(
    @Query('language_id') languageId?: string,
    @Query('exercise_type_id') exerciseTypeId?: string,
    @Query('is_active') isActive?: string,
  ) {
    return this.exercisesService.findAll({
      language_id: languageId ? parseInt(languageId, 10) : undefined,
      exercise_type_id: exerciseTypeId
        ? parseInt(exerciseTypeId, 10)
        : undefined,
      is_active: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  // Öffentlich — einzelne Übung ansehen
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }

  // Nur Admins dürfen Content anlegen/ändern/löschen
  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exercisesService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }
}

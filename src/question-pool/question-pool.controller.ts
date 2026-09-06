import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionPoolService } from './question-pool.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

// Kompletter Fragenpool ist admin-only - jeder Eintrag enthält die
// Musterlösung, daher gibt es hier (anders als bei Words/Exercises) keinen
// öffentlichen Lesezugriff.
@UseGuards(AdminJwtGuard)
@Controller('question-pool')
export class QuestionPoolController {
  constructor(private readonly questionPoolService: QuestionPoolService) {}

  @Get()
  findAll(@Query('language_id') languageId?: string) {
    return this.questionPoolService.findAll(
      languageId ? Number(languageId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionPoolService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.questionPoolService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionPoolService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionPoolService.remove(id);
  }
}

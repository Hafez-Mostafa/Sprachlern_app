import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { BulkCreateWordsDto } from './dto/bulk-create-words.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { ImageUpsertDto } from './dto/image-upsert.dto';
import { AudioUpsertDto } from './dto/audio-upsert.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  // --- Öffentlich lesbar ---

  @Get()
  findAll(
    @Query('language_id') languageId?: string,
    @Query('search') search?: string,
  ) {
    return this.wordsService.findAll({
      language_id: languageId ? parseInt(languageId, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wordsService.findOne(id);
  }

  // --- Admin-only ---

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateWordDto) {
    return this.wordsService.create(dto);
  }
  @UseGuards(AdminJwtGuard)
  @Post('bulk')
  createMany(@Body() dto: BulkCreateWordsDto) {
    return this.wordsService.createMany(dto.words);
  }
  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWordDto) {
    return this.wordsService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wordsService.remove(id);
  }

  // --- Bild ---

  @UseGuards(AdminJwtGuard)
  @Put(':id/image')
  setImage(@Param('id') id: string, @Body() dto: ImageUpsertDto) {
    return this.wordsService.setImage(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id/image')
  removeImage(@Param('id') id: string) {
    return this.wordsService.removeImage(id);
  }

  // --- Audio ---

  @UseGuards(AdminJwtGuard)
  @Put(':id/audio')
  setAudio(@Param('id') id: string, @Body() dto: AudioUpsertDto) {
    return this.wordsService.setAudio(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id/audio')
  removeAudio(@Param('id') id: string) {
    return this.wordsService.removeAudio(id);
  }
}

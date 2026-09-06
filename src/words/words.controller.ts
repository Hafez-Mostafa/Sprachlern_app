import {
  Controller,
  Get,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WordsService } from './words.service';
import { UpdateWordDto } from './dto/update-word.dto';
import { AudioUpsertDto } from './dto/audio-upsert.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import type { UploadedMediaFile } from '../media/media.service';

// Wörter werden nicht mehr hier angelegt/gelöscht als eigenständige
// Ressource - siehe ConceptsController (POST /concepts). Dieser Controller
// deckt nur noch Lesezugriffe, Text-Korrektur und Audio ab.
@Controller('words')
export class WordsController {
 constructor(private readonly wordsService: WordsService) {}

 // --- Öffentlich lesbar ---

 @Get()
 findAll(
   @Query('language_id') languageId?: string,
   @Query('search') search?: string,
 ){
   return this.wordsService.findAll({
     language_id: languageId ? parseInt(languageId, 10) : undefined,
     search,
   });
 }
 @Get(':wordId/tasks')
 findTasksUsingWord(@Param('wordId') wordId: string) {
   return this.wordsService.findTasksUsingWord(wordId);
 }

 @Get(':id')
 findOne(@Param('id') id: string) {
   return this.wordsService.findOne(id);
 }

 // --- Admin-only ---

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

 // --- Audio ---

 @UseGuards(AdminJwtGuard)
 @Put(':id/audio')
 setAudio(@Param('id') id: string, @Body() dto: AudioUpsertDto) {
   return this.wordsService.setAudio(id, dto);
 }

 @UseGuards(AdminJwtGuard)
 @Put(':id/audio/upload')
 @UseInterceptors(
   FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
 )
 uploadAudio(
   @Param('id') id: string,
   @UploadedFile() file: UploadedMediaFile,
 ){
   return this.wordsService.uploadAudio(id, file);
 }

 @UseGuards(AdminJwtGuard)
 @Delete(':id/audio')
 removeAudio(@Param('id') id: string) {
   return this.wordsService.removeAudio(id);
 }
}

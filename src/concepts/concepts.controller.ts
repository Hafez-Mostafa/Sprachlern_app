import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConceptsService } from './concepts.service';
import { CreateConceptDto } from './dto/create-concept.dto';
import { ConceptTranslationDto } from './dto/concept-translation.dto';
import { ConceptImageUpsertDto } from './dto/concept-image-upsert.dto';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import type { UploadedMediaFile } from '../media/media.service';

// Concepts sind die sprachübergreifende Klammer um Wörter: ein Bild,
// ein Text+Audio pro Sprache. Lesend öffentlich (wird von der Lern-App
// gebraucht), schreibend nur Admin - identisches Muster wie bei Exercises/
// Words/Tasks.
@Controller('concepts')
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Get()
  findAll() {
    return this.conceptsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conceptsService.findOne(id);
  }

  // Erzwingt beim Anlegen einen Text für JEDE aktive app_language -
  // siehe ConceptsService.assertCompleteLanguageSet().
  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateConceptDto) {
    return this.conceptsService.create(dto);
  }

  // Für den Fall, dass eine neue app_language nachträglich eingeführt wird
  // und bestehende Concepts dadurch unvollständig werden.
  @UseGuards(AdminJwtGuard)
  @Post(':id/translations')
  addTranslation(
    @Param('id') id: string,
    @Body() dto: ConceptTranslationDto,
  ) {
    return this.conceptsService.addTranslation(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conceptsService.remove(id);
  }

  // --- Bild (ein Bild für alle Sprachen dieses Concepts) ---

  @UseGuards(AdminJwtGuard)
  @Put(':id/image')
  setImage(@Param('id') id: string, @Body() dto: ConceptImageUpsertDto) {
    return this.conceptsService.setImage(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Put(':id/image/upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  uploadImage(
    @Param('id') id: string,
    @Body('description') description: string | undefined,
    @UploadedFile() file: UploadedMediaFile,
  ) {
    return this.conceptsService.uploadImage(id, file, description);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id/image')
  removeImage(@Param('id') id: string) {
    return this.conceptsService.removeImage(id);
  }
}

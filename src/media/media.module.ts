import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MediaService } from './media.service';

// Bewusst KEIN Controller mehr hier — das war der unsichere, doppelte
// Endpunkt-Satz, der bereits gelöscht wurde. Dieses Modul stellt nur noch
// den MediaService als wiederverwendbaren Baustein für andere Module
// (aktuell: WordsModule) bereit.
@Module({
  imports: [CloudinaryModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}

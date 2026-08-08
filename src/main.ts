import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      //Entfernt automatisch alle Felder aus dem Request-Body, die nicht im DTO definiert sind
      whitelist: true,
      // true	Wirft einen Fehler (400), statt Felder nur stillschweigend zu entfernen — gut, um Tippfehler im Request früh zu bemerken
      forbidNonWhitelisted: true,
      // Wandelt eingehende JSON-Daten automatisch in die richtigen Typen um (z.B. String aus der URL zu number, falls nötig)
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet zuerst - setzt sichere HTTP-Header auf jede Response
  const isProd = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? undefined // Helmet-Standard-CSP (strikt) in Prod
        : {
            directives: {
              defaultSrc: [`'self'`],
              styleSrc: [`'self'`, `'unsafe-inline'`],
              scriptSrc: [`'self'`, `'unsafe-inline'`],
              imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
            },
          },
    }),
  );
  const corsOrigins = process.env.CORS_ORIGINS;

  if (!corsOrigins) {
    throw new Error('CORS_ORIGINS env variable is not set');
  }

  const allowedOrigins = corsOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Server-to-server / curl / Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

    credentials: true,
  });
  // const corsOrigins = process.env.CORS_ORIGINS;
  // if (!corsOrigins) {
  //   throw new Error('CORS_ORIGINS env variable is not set');
  // }
  // const allowedOrigins = corsOrigins.split(',').map((o) => o.trim());

  // app.enableCors({
  //   origin: (origin, callback) => {
  //     // origin ist undefined bei Server-zu-Server-Requests oder Tools wie Postman
  //     if (!origin || allowedOrigins.includes(origin)) {
  //       callback(null, true);
  //     } else {
  //       console.warn(`CORS blocked request from origin: ${origin}`);
  //       callback(new Error('Not allowed by CORS'), false);
  //     }
  //   },
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  //   credentials: true,
  // });

  app.useGlobalPipes(
    new ValidationPipe({
      // Entfernt automatisch alle Felder aus dem Request-Body, die nicht im DTO definiert sind
      whitelist: true,
      // Wirft einen Fehler (400), statt Felder nur stillschweigend zu entfernen — gut, um Tippfehler im Request früh zu bemerken
      forbidNonWhitelisted: true,
      // Wandelt eingehende JSON-Daten automatisch in die richtigen Typen um (z.B. String aus der URL zu number, falls nötig)
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

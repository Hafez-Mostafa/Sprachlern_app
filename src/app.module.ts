import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChildProfilesModule } from './child-profiles/child-profiles.module';
import { LookupsModule } from './lookups/lookups.module';
import { GuardiansModule } from './guardians/guardians.module';
import { AdminsModule } from './admins/admins.module';
import { ExercisesModule } from './exercises/exercises.module';
import { TasksModule } from './tasks/tasks.module';
import { WordsModule } from './words/words.module';
import { LearningProgressModule } from './learning-progress/learning-progress.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        // "default" Limit: greift für alle Routes, die nicht anders konfiguriert sind
        name: 'default',
        ttl: 60000, // Zeitfenster in ms (hier: 60 Sekunden)
        limit: 100, // max. 100 Requests pro IP innerhalb des ttl-Fensters
      },
    ]),
    PrismaModule,
    AuthModule,
    ChildProfilesModule,
    LookupsModule,
    GuardiansModule,
    AdminsModule,
    ExercisesModule,
    TasksModule,
    WordsModule,
    LearningProgressModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // Wendet ThrottlerGuard global auf ALLE Routes an
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

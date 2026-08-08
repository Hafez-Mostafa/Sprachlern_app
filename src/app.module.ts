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

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ChildProfilesModule,
    LookupsModule,
    GuardiansModule,
    AdminsModule,
    ExercisesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

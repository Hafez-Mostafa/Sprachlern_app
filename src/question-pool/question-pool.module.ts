import { Module } from '@nestjs/common';
import { QuestionPoolController } from './question-pool.controller';
import { QuestionPoolService } from './question-pool.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionPoolController],
  providers: [QuestionPoolService],
  exports: [QuestionPoolService],
})
export class QuestionPoolModule {}

import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}

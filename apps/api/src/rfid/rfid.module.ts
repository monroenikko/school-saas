import { Module } from '@nestjs/common';
import { RfidService } from './rfid.service';
import { RfidController } from './rfid.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RfidController],
  providers: [RfidService],
  exports: [RfidService],
})
export class RfidModule {}

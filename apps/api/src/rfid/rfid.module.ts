import { Module } from '@nestjs/common';
import { RfidService } from './rfid.service';
import { RfidController } from './rfid.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RfidController],
  providers: [RfidService],
  exports: [RfidService],
})
export class RfidModule {}


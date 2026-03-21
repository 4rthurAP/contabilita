import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisConfig from '../../config/redis.config';
import { QUEUE_NAMES, QUEUE_DEFAULT_OPTIONS } from './queue.constants';
import { QueueDashboardController } from './queue-dashboard.controller';
import { QueueDashboardService } from './queue-dashboard.service';

const queueRegistrations = Object.values(QUEUE_NAMES).map((name) => ({
  name,
  ...QUEUE_DEFAULT_OPTIONS,
}));

@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    ...queueRegistrations.map((reg) => BullModule.registerQueue(reg)),
  ],
  controllers: [QueueDashboardController],
  providers: [QueueDashboardService],
  exports: [BullModule],
})
export class QueueModule {}

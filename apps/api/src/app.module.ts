import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CompanyModule } from './modules/company/company.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env', '../../.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    TenantModule,
    CompanyModule,
    AccountingModule,
    FiscalModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica TenantMiddleware em todas as rotas exceto auth e health
    consumer
      .apply(TenantMiddleware)
      .exclude('api/auth/(.*)', 'api/health')
      .forRoutes('*');
  }
}

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CompanyModule } from './modules/company/company.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { LalurModule } from './modules/lalur/lalur.module';
import { AssetsModule } from './modules/assets/assets.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ObligationsModule } from './modules/obligations/obligations.module';
import { TaxUpdateModule } from './modules/tax-update/tax-update.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ClientPortalModule } from './modules/client-portal/client-portal.module';
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
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // 100 requests/minute
    HealthModule,
    AuthModule,
    TenantModule,
    CompanyModule,
    AccountingModule,
    FiscalModule,
    PayrollModule,
    LalurModule,
    AssetsModule,
    ReportsModule,
    ObligationsModule,
    TaxUpdateModule,
    AuditModule,
    NotificationModule,
    ClientPortalModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
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

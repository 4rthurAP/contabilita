import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../payroll/schemas/employee.schema';
import { Payslip, PayslipSchema } from '../payroll/schemas/payslip.schema';
import { EmployeePortalController } from './employee-portal.controller';
import { EmployeePortalService } from './employee-portal.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Payslip.name, schema: PayslipSchema },
    ]),
    TenantModule,
  ],
  controllers: [EmployeePortalController],
  providers: [EmployeePortalService],
})
export class EmployeePortalModule {}

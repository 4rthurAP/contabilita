import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from './schemas/employee.schema';
import { PayrollRun, PayrollRunSchema } from './schemas/payroll-run.schema';
import { Payslip, PayslipSchema } from './schemas/payslip.schema';
import { EmployeeService } from './services/employee.service';
import { PayrollRunService } from './services/payroll-run.service';
import { PayrollCalcService } from './services/payroll-calc.service';
import { PayrollCompletedListener } from './listeners/payroll-completed.listener';
import { EmployeeController } from './controllers/employee.controller';
import { PayrollRunController } from './controllers/payroll-run.controller';
import { TenantModule } from '../tenant/tenant.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: PayrollRun.name, schema: PayrollRunSchema },
      { name: Payslip.name, schema: PayslipSchema },
    ]),
    TenantModule,
    AccountingModule,
  ],
  controllers: [EmployeeController, PayrollRunController],
  providers: [EmployeeService, PayrollRunService, PayrollCalcService, PayrollCompletedListener],
  exports: [EmployeeService, PayrollRunService],
})
export class PayrollModule {}

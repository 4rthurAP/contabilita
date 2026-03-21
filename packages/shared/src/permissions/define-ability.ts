import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { TenantRole } from '../enums/tenant.enums.js';
import type { AppAction, AppSubject } from '../types/permissions.types.js';

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export function defineAbilityFor(role: TenantRole): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case TenantRole.Owner:
    case TenantRole.Admin:
      can('manage', 'all');
      break;

    case TenantRole.Accountant:
      // Read-only
      can('read', ['Dashboard', 'Report', 'ClientPortal', 'EmployeePortal']);
      // CRUD on company (no delete)
      can(['read', 'create', 'update'], 'Company');
      // Full manage
      can('manage', [
        'Account',
        'JournalEntry',
        'FiscalInvoice',
        'Obligation',
        'Protocolo',
        'Registro',
        'BuscaNfe',
        'Certificate',
        'TaxAssessment',
        'TaxPayment',
        'TaxUpdate',
        'Asset',
        'Payroll',
        'Employee',
        'Lalur',
        'Custo',
      ]);
      // Read-only
      can('read', ['Honorario', 'Cct']);
      break;

    case TenantRole.Analyst:
      can('read', [
        'Dashboard',
        'Report',
        'ClientPortal',
        'EmployeePortal',
        'Company',
        'Account',
        'JournalEntry',
        'FiscalInvoice',
        'Obligation',
        'Protocolo',
        'Registro',
        'BuscaNfe',
        'TaxAssessment',
        'TaxPayment',
        'TaxUpdate',
        'Asset',
        'Payroll',
        'Employee',
        'Lalur',
        'Custo',
        'Cct',
      ]);
      break;

    case TenantRole.Viewer:
      can('read', [
        'Dashboard',
        'Report',
        'ClientPortal',
        'EmployeePortal',
        'Company',
        'Account',
        'JournalEntry',
        'FiscalInvoice',
        'Obligation',
        'Protocolo',
        'Registro',
        'BuscaNfe',
        'TaxAssessment',
        'TaxPayment',
        'TaxUpdate',
        'Asset',
      ]);
      break;
  }

  return build();
}

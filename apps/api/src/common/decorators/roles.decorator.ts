import { SetMetadata } from '@nestjs/common';
import { TenantRole } from '@contabilita/shared';
import { ROLES_KEY } from '../../modules/tenant/guards/roles.guard';

export const Roles = (...roles: TenantRole[]) => SetMetadata(ROLES_KEY, roles);

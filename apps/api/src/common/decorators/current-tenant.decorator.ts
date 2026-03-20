import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getCurrentTenant } from '../../modules/tenant/tenant.context';

export const CurrentTenant = createParamDecorator((_data: unknown, _ctx: ExecutionContext) => {
  return getCurrentTenant();
});

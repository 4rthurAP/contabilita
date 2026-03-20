import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getCurrentTenant } from '../tenant.context';
import { TenantRole } from '@contabilita/shared';

export const ROLES_KEY = 'roles';

/**
 * Guard que verifica se o usuario tem uma das roles permitidas.
 * Usar com o decorator @Roles()
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const tenantCtx = getCurrentTenant();
    if (!tenantCtx) {
      throw new ForbiddenException('Contexto de tenant nao encontrado');
    }

    const hasRole = requiredRoles.some((role) => tenantCtx.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Permissao insuficiente');
    }

    return true;
  }
}

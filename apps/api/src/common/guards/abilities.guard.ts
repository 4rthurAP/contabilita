import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getCurrentTenant } from '../../modules/tenant/tenant.context';
import { defineAbilityFor, TenantRole } from '@contabilita/shared';
import { ABILITIES_KEY, type RequiredAbility } from '../decorators/check-abilities.decorator';

/**
 * Guard que verifica abilities CASL do usuario.
 * Reutiliza defineAbilityFor do shared package (mesma logica do frontend).
 * Usar com o decorator @CheckAbilities().
 */
@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAbilities = this.reflector.getAllAndOverride<RequiredAbility[]>(ABILITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAbilities || requiredAbilities.length === 0) {
      return true;
    }

    const tenantCtx = getCurrentTenant();
    if (!tenantCtx) {
      throw new ForbiddenException('Contexto de tenant nao encontrado');
    }

    const ability = defineAbilityFor(tenantCtx.role as TenantRole);

    const hasAll = requiredAbilities.every(([action, subject]) => ability.can(action, subject));
    if (!hasAll) {
      throw new ForbiddenException('Permissao insuficiente');
    }

    return true;
  }
}

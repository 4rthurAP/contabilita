import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantUser, TenantUserDocument } from '../schemas/tenant-user.schema';
import { tenantContext, TenantContextData } from '../tenant.context';

/**
 * Guard que verifica se o usuario autenticado tem acesso ao tenant
 * e popula o contexto com a role do usuario.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(TenantUser.name) private tenantUserModel: Model<TenantUserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Header X-Tenant-Id obrigatorio');
    }

    if (!user) {
      throw new ForbiddenException('Autenticacao necessaria');
    }

    // SuperAdmin tem acesso a todos os tenants
    if (user.isSuperAdmin) {
      this.setTenantContext({ tenantId, userId: user.id, role: 'owner' });
      return true;
    }

    const tenantUser = await this.tenantUserModel.findOne({
      tenantId,
      userId: user._id,
      isActive: true,
    });

    if (!tenantUser) {
      throw new ForbiddenException('Voce nao tem acesso a este escritorio');
    }

    this.setTenantContext({ tenantId, userId: user.id, role: tenantUser.role });
    return true;
  }

  private setTenantContext(data: TenantContextData) {
    // Update the existing AsyncLocalStorage context
    const store = tenantContext.getStore();
    if (store) {
      Object.assign(store, data);
    }
  }
}

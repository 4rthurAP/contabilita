import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { requireCurrentTenant, getCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  /** Registra uma acao no log de auditoria */
  async log(params: {
    action: string;
    resource: string;
    resourceId?: string;
    description?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const ctx = getCurrentTenant();

    // Calcular campos alterados
    let changedFields: string[] = [];
    if (params.before && params.after) {
      changedFields = Object.keys(params.after).filter((key) => {
        if (['updatedAt', 'updatedBy', '__v'].includes(key)) return false;
        return JSON.stringify(params.before![key]) !== JSON.stringify(params.after![key]);
      });
    }

    return this.auditModel.create({
      tenantId: ctx?.tenantId,
      userId: params.userId || ctx?.userId,
      userName: params.userName,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      description: params.description,
      before: params.before,
      after: params.after,
      changedFields,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /** Busca logs de auditoria com filtros */
  async findAll(
    companyId?: string,
    page = 1,
    limit = 50,
    filters?: { resource?: string; action?: string; userId?: string; startDate?: string; endDate?: string },
  ) {
    const ctx = requireCurrentTenant();
    const query: any = { tenantId: ctx.tenantId };

    if (filters?.resource) query.resource = filters.resource;
    if (filters?.action) query.action = filters.action;
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const [data, total] = await Promise.all([
      this.auditModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.auditModel.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Timeline de um recurso especifico */
  async getResourceTimeline(resource: string, resourceId: string) {
    const ctx = requireCurrentTenant();
    return this.auditModel
      .find({ tenantId: ctx.tenantId, resource, resourceId })
      .sort({ createdAt: -1 });
  }
}

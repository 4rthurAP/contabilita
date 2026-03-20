import { Schema } from 'mongoose';

/**
 * Plugin Mongoose que adiciona tenantId a todas as collections tenant-scoped.
 * Cria indice composto com tenantId como primeiro campo para performance.
 */
export function tenantScopedPlugin(schema: Schema) {
  schema.add({
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  });

  schema.index({ tenantId: 1, _id: 1 });
}

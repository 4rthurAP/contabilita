import { Schema } from 'mongoose';

/**
 * Plugin Mongoose para trilha de auditoria.
 * Adiciona createdBy/updatedBy e timestamps automaticos.
 */
export function auditTrailPlugin(schema: Schema) {
  schema.add({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  });

  if (!schema.get('timestamps')) {
    schema.set('timestamps', true);
  }
}

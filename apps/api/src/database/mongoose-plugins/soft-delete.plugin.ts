import { Schema } from 'mongoose';

/**
 * Plugin Mongoose para soft delete.
 * Adiciona campo deletedAt e filtra automaticamente documentos deletados.
 */
export function softDeletePlugin(schema: Schema) {
  schema.add({
    deletedAt: { type: Date, default: null },
  });

  schema.index({ deletedAt: 1 });

  // Filtra documentos deletados em todas as queries find*
  schema.pre(/^find/, function (next) {
    const query = this as any;
    if (query.getOptions()?.includeDeleted) {
      return next();
    }
    query.where({ deletedAt: null });
    next();
  });

  // Filtra em countDocuments
  schema.pre('countDocuments', function (next) {
    const query = this as any;
    if (query.getOptions()?.includeDeleted) {
      return next();
    }
    query.where({ deletedAt: null });
    next();
  });

  schema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
  };
}

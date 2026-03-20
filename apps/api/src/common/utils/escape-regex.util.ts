/**
 * Escapa caracteres especiais de regex para uso seguro em $regex do MongoDB.
 * Previne injection via manipulacao de expressoes regulares.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

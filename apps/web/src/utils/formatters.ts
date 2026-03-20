/** Formata CPF: 000.000.000-00 */
export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/** Formata CNPJ: 00.000.000/0000-00 */
export function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/** Converte string em formato brasileiro (1.234,56) para number */
export function parseBrazilianNumber(value: string): number {
  // Se contiver virgula, tratar como separador decimal brasileiro
  if (value.includes(',')) {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(value);
}

/** Formata valor monetario em BRL */
export function formatMoeda(value: number | string): string {
  const num = typeof value === 'string' ? parseBrazilianNumber(value) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Converte Decimal128 do MongoDB para number */
export function parseDecimal128(value: any): number {
  return parseFloat(value?.$numberDecimal || value || '0');
}

/** Alias curto para parseDecimal128 */
export const d128 = parseDecimal128;

/** Formata CEP: 00000-000 */
export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

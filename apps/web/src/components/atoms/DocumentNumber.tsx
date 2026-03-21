import { cn } from '@/lib/utils';
import { formatCnpj, formatCpf } from '@/utils/formatters';

interface DocumentNumberProps {
  value: string;
  type?: 'cpf' | 'cnpj' | 'auto';
  className?: string;
}

/**
 * Exibe CPF ou CNPJ formatado.
 * Quando `type` e "auto", detecta pelo tamanho dos digitos.
 */
export function DocumentNumber({ value, type = 'auto', className }: DocumentNumberProps) {
  const digits = value.replace(/\D/g, '');

  const resolvedType = type === 'auto'
    ? digits.length <= 11 ? 'cpf' : 'cnpj'
    : type;

  const formatted = resolvedType === 'cpf' ? formatCpf(digits) : formatCnpj(digits);

  return (
    <span className={cn('font-mono tabular-nums text-sm', className)}>
      {formatted}
    </span>
  );
}

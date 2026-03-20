import { formatMoeda } from '@/utils/formatters';

interface DRELineProps {
  label: string;
  value: string;
  bold?: boolean;
  indent?: boolean;
}

export function DRELine({ label, value, bold = false, indent = false }: DRELineProps) {
  return (
    <div className={`flex justify-between py-1.5 ${bold ? 'font-semibold border-t' : ''} ${indent ? 'pl-4' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className={`font-mono text-sm ${parseFloat(value) < 0 ? 'text-credit' : ''}`}>
        {formatMoeda(parseFloat(value))}
      </span>
    </div>
  );
}

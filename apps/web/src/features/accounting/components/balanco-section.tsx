import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoeda } from '@/utils/formatters';

interface BalancoSectionProps {
  title: string;
  section: any;
  className?: string;
}

export function BalancoSection({ title, section, className }: BalancoSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base ${className || ''}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {section?.accounts?.map((acc: any) => (
          <div key={acc.accountId} className="flex justify-between py-1 text-sm border-b last:border-0">
            <span>
              <span className="text-xs font-mono text-muted-foreground mr-2">{acc.codigo}</span>
              {acc.nome}
            </span>
            <span className="font-mono">{formatMoeda(parseFloat(acc.saldo))}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 font-semibold text-sm border-t mt-2">
          <span>Total {title}</span>
          <span className="font-mono">{formatMoeda(parseFloat(section?.total || '0'))}</span>
        </div>
      </CardContent>
    </Card>
  );
}

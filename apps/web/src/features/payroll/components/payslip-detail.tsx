import { formatMoeda, d128 } from '@/utils/formatters';

interface PayslipDetailProps {
  payslips: any[];
}

export function PayslipDetail({ payslips }: PayslipDetailProps) {
  return (
    <div className="border-t pt-3">
      {payslips.map((ps: any) => (
        <div key={ps._id} className="rounded border p-3 mb-2">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-sm">{ps.employeeName}</span>
            <span className="text-sm font-mono">{formatMoeda(d128(ps.salarioLiquido))}</span>
          </div>
          <div className="text-xs space-y-0.5">
            {ps.lines?.map((line: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span className={line.tipo === 'desconto' ? 'text-credit' : line.tipo === 'informativa' ? 'text-muted-foreground' : ''}>
                  {line.codigo} - {line.descricao}
                </span>
                <span className={line.tipo === 'desconto' ? 'text-credit' : line.tipo === 'informativa' ? 'text-muted-foreground' : ''}>
                  {line.tipo === 'desconto' ? '-' : ''}{formatMoeda(d128(line.valor))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

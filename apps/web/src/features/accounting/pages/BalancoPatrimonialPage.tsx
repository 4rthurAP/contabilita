import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { useBalancoPatrimonial } from '@/features/reports/hooks/useReports';
import { BalancoSection } from '../components/balanco-section';
import dayjs from 'dayjs';

function BalancoContent({ companyId }: { companyId: string }) {
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [queryDate, setQueryDate] = useState(endDate);

  const { data, isLoading } = useBalancoPatrimonial(companyId, queryDate);

  return (
    <div className="space-y-6">
      <PageHeader title="Balanco Patrimonial" breadcrumbs={[{ label: 'Contabilidade', href: '/app/accounting' }, { label: 'Balanco Patrimonial' }]} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Data base</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={() => setQueryDate(endDate)}>Gerar</Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <BalancoSection title="Ativo" section={data.ativo} className="text-info" />
          </div>
          <div className="space-y-4">
            <BalancoSection title="Passivo" section={data.passivo} className="text-credit" />
            <BalancoSection title="Patrimonio Liquido" section={data.patrimonioLiquido} className="text-success" />
            <div className="text-center text-sm">
              {data.balanced ? (
                <span className="text-success font-medium">Ativo = Passivo + PL (Balanceado)</span>
              ) : (
                <span className="text-destructive font-medium">Desbalanceado!</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BalancoPatrimonialPage() {
  return <CompanyRequired>{(companyId) => <BalancoContent companyId={companyId} />}</CompanyRequired>;
}

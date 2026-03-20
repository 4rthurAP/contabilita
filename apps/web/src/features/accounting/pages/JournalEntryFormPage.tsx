import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { FormField } from '@/components/molecules/form-field';
import { CompanyRequired } from '@/components/molecules/company-required';
import { useAnalyticalAccounts, useCreateJournalEntry } from '../hooks/useAccounting';
import { JournalEntryLines } from '../components/journal-entry-lines';
import { TipoLancamento } from '@contabilita/shared';

const lineSchema = z.object({
  accountId: z.string().min(1, 'Selecione uma conta'),
  debit: z.string().default('0'),
  credit: z.string().default('0'),
  historico: z.string().min(1, 'Historico obrigatorio'),
});

const entrySchema = z.object({
  date: z.string().min(1, 'Data obrigatoria'),
  tipo: z.nativeEnum(TipoLancamento),
  description: z.string().min(1, 'Descricao obrigatoria'),
  lines: z.array(lineSchema).min(2, 'Minimo 2 linhas'),
});

type EntryForm = z.infer<typeof entrySchema>;

function EntryFormContent({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const { data: accounts } = useAnalyticalAccounts(companyId);
  const createEntry = useCreateJournalEntry(companyId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      tipo: TipoLancamento.Manual,
      description: '',
      lines: [
        { accountId: '', debit: '', credit: '0', historico: '' },
        { accountId: '', debit: '0', credit: '', historico: '' },
      ],
    },
  });

  const watchedLines = useWatch({ control, name: 'lines' });

  const totalDebit = watchedLines?.reduce((sum: number, l: any) => sum + parseFloat(l?.debit || '0'), 0) || 0;
  const totalCredit = watchedLines?.reduce((sum: number, l: any) => sum + parseFloat(l?.credit || '0'), 0) || 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const onSubmit = (data: EntryForm) => {
    createEntry.mutate(data, {
      onSuccess: () => navigate(`/accounting/journal-entries?companyId=${companyId}`),
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Novo Lancamento Contabil" description="Lancamento com partida dobrada" />

      <Card>
        <CardHeader>
          <CardTitle>Dados do Lancamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Data" error={errors.date?.message}>
                <Input type="date" {...register('date')} />
              </FormField>
              <FormField label="Tipo">
                <Select {...register('tipo')}>
                  <option value={TipoLancamento.Manual}>Manual</option>
                  <option value={TipoLancamento.Automatico}>Automatico</option>
                  <option value={TipoLancamento.Importado}>Importado</option>
                  <option value={TipoLancamento.Estorno}>Estorno</option>
                </Select>
              </FormField>
              <FormField label="Descricao" error={errors.description?.message}>
                <Input placeholder="Descricao do lancamento" {...register('description')} />
              </FormField>
            </div>

            <JournalEntryLines
              control={control}
              register={register}
              errors={errors}
              accounts={accounts}
              totalDebit={totalDebit}
              totalCredit={totalCredit}
              isBalanced={isBalanced}
            />

            {createEntry.error && (
              <p className="text-sm text-destructive">
                {(createEntry.error as any).response?.data?.message || 'Erro ao salvar'}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={createEntry.isPending || !isBalanced}>
                {createEntry.isPending ? 'Salvando...' : 'Lancar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function JournalEntryFormPage() {
  return <CompanyRequired>{(companyId) => <EntryFormContent companyId={companyId} />}</CompanyRequired>;
}

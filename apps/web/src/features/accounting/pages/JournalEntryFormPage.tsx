import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticalAccounts, useCreateJournalEntry } from '../hooks/useAccounting';
import { TipoLancamento } from '@contabilita/shared';
import { formatMoeda } from '@/utils/formatters';

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

export function JournalEntryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
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

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = useWatch({ control, name: 'lines' });

  const totalDebit = watchedLines?.reduce((sum, l) => sum + parseFloat(l?.debit || '0'), 0) || 0;
  const totalCredit = watchedLines?.reduce((sum, l) => sum + parseFloat(l?.credit || '0'), 0) || 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const onSubmit = (data: EntryForm) => {
    createEntry.mutate(data, {
      onSuccess: () => navigate(`/accounting/journal-entries?companyId=${companyId}`),
    });
  };

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Lancamento Contabil</h1>
        <p className="text-muted-foreground">Lancamento com partida dobrada</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Lancamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  {...register('tipo')}
                >
                  <option value={TipoLancamento.Manual}>Manual</option>
                  <option value={TipoLancamento.Automatico}>Automatico</option>
                  <option value={TipoLancamento.Importado}>Importado</option>
                  <option value={TipoLancamento.Estorno}>Estorno</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descricao</label>
                <Input placeholder="Descricao do lancamento" {...register('description')} />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Linhas do lancamento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Linhas</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ accountId: '', debit: '0', credit: '0', historico: '' })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Linha
                </Button>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-4">Conta</div>
                  <div className="col-span-2">Debito</div>
                  <div className="col-span-2">Credito</div>
                  <div className="col-span-3">Historico</div>
                  <div className="col-span-1"></div>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 px-3 py-2 border-t">
                    <div className="col-span-4">
                      <select
                        className="flex h-8 w-full rounded border bg-transparent px-2 text-sm"
                        {...register(`lines.${index}.accountId`)}
                      >
                        <option value="">Selecione...</option>
                        {accounts?.map((acc) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.codigo} - {acc.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8"
                        placeholder="0.00"
                        {...register(`lines.${index}.debit`)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8"
                        placeholder="0.00"
                        {...register(`lines.${index}.credit`)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        className="h-8"
                        placeholder="Historico"
                        {...register(`lines.${index}.historico`)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Totais */}
                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 border-t font-medium text-sm">
                  <div className="col-span-4 text-right">Totais:</div>
                  <div className="col-span-2">{formatMoeda(totalDebit)}</div>
                  <div className="col-span-2">{formatMoeda(totalCredit)}</div>
                  <div className="col-span-4">
                    {isBalanced ? (
                      <span className="text-green-600 text-xs">Balanceado</span>
                    ) : totalDebit > 0 || totalCredit > 0 ? (
                      <span className="text-destructive text-xs">
                        Diferenca: {formatMoeda(Math.abs(totalDebit - totalCredit))}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {errors.lines && (
                <p className="text-sm text-destructive">{errors.lines.message || errors.lines.root?.message}</p>
              )}
            </div>

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

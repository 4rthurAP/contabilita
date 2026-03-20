import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatMoeda } from '@/utils/formatters';

interface Account {
  _id: string;
  codigo: string;
  nome: string;
}

interface JournalEntryLinesProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  accounts: Account[] | undefined;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export function JournalEntryLines({
  control,
  register,
  errors,
  accounts,
  totalDebit,
  totalCredit,
  isBalanced,
}: JournalEntryLinesProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Linhas</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ accountId: '', debit: '0', credit: '0', historico: '' })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Linha
        </Button>
      </div>

      {/* Desktop: grid table */}
      <div className="hidden md:block overflow-x-auto rounded-md border">
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
              <Select className="h-8" {...register(`lines.${index}.accountId`)}>
                <option value="">Selecione...</option>
                {accounts?.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.codigo} - {acc.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <Input type="number" step="0.01" min="0" className="h-8" placeholder="0.00" {...register(`lines.${index}.debit`)} />
            </div>
            <div className="col-span-2">
              <Input type="number" step="0.01" min="0" className="h-8" placeholder="0.00" {...register(`lines.${index}.credit`)} />
            </div>
            <div className="col-span-3">
              <Input className="h-8" placeholder="Historico" {...register(`lines.${index}.historico`)} />
            </div>
            <div className="col-span-1 flex justify-center">
              {fields.length > 2 && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 border-t font-medium text-sm">
          <div className="col-span-4 text-right">Totais:</div>
          <div className="col-span-2">{formatMoeda(totalDebit)}</div>
          <div className="col-span-2">{formatMoeda(totalCredit)}</div>
          <div className="col-span-4">
            {isBalanced ? (
              <span className="text-success text-xs">Balanceado</span>
            ) : totalDebit > 0 || totalCredit > 0 ? (
              <span className="text-destructive text-xs">
                Diferenca: {formatMoeda(Math.abs(totalDebit - totalCredit))}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Linha {index + 1}</span>
              {fields.length > 2 && (
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
            <Select {...register(`lines.${index}.accountId`)}>
              <option value="">Selecione conta...</option>
              {accounts?.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.codigo} - {acc.nome}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Debito</label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...register(`lines.${index}.debit`)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Credito</label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...register(`lines.${index}.credit`)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Historico</label>
              <Input placeholder="Historico" {...register(`lines.${index}.historico`)} />
            </div>
          </div>
        ))}

        <div className="rounded-md bg-muted/50 p-3 text-sm font-medium flex justify-between">
          <span>D: {formatMoeda(totalDebit)} | C: {formatMoeda(totalCredit)}</span>
          {isBalanced ? (
            <span className="text-success text-xs">Balanceado</span>
          ) : totalDebit > 0 || totalCredit > 0 ? (
            <span className="text-destructive text-xs">
              Dif: {formatMoeda(Math.abs(totalDebit - totalCredit))}
            </span>
          ) : null}
        </div>
      </div>

      {(errors as any).lines && (
        <p className="text-sm text-destructive">{(errors as any).lines.message || (errors as any).lines.root?.message}</p>
      )}
    </div>
  );
}

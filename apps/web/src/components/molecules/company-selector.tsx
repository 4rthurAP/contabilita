import { useState } from 'react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Company {
  _id: string;
  razaoSocial: string;
  cnpj?: string;
}

interface CompanySelectorProps {
  companies: Company[];
  selectedId?: string;
  onSelect: (companyId: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Dropdown de selecao de empresa com busca.
 * Filtra pelo nome (razao social) ou CNPJ enquanto o usuario digita.
 */
export function CompanySelector({
  companies,
  selectedId,
  onSelect,
  placeholder = 'Selecionar empresa...',
  className,
}: CompanySelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const selected = companies.find((c) => c._id === selectedId);

  const filtered = search
    ? companies.filter(
        (c) =>
          c.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
          c.cnpj?.includes(search.replace(/\D/g, '')),
      )
    : companies;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selected ? selected.razaoSocial : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto" align="start">
        <div className="p-2">
          <Input
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        {filtered.length === 0 && (
          <p className="px-4 py-2 text-sm text-muted-foreground">
            Nenhuma empresa encontrada
          </p>
        )}
        {filtered.map((company) => (
          <DropdownMenuItem
            key={company._id}
            onClick={() => {
              onSelect(company._id);
              setOpen(false);
              setSearch('');
            }}
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4',
                selectedId === company._id ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span className="truncate">{company.razaoSocial}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/molecules/page-header';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { ConfirmDialog } from '@/components/molecules/confirm-dialog';
import { Pagination } from '@/components/molecules/pagination';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { REGIME_LABELS } from '@/lib/constants';
import { useCompanies, useDeleteCompany } from '../hooks/useCompanies';
import { formatCnpj } from '@/utils/formatters';

export function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data, isLoading } = useCompanies(page, search || undefined);
  const deleteCompany = useDeleteCompany();

  const columns: Column<any>[] = [
    { key: 'razaoSocial', header: 'Razao Social', render: (c) => <span className="font-medium">{c.razaoSocial}</span> },
    { key: 'cnpj', header: 'CNPJ', className: 'w-36', hideOnMobile: true, render: (c) => <span className="font-mono text-xs">{formatCnpj(c.cnpj)}</span> },
    { key: 'regime', header: 'Regime', className: 'w-36', hideOnMobile: true, render: (c) => <Badge variant="neutral">{REGIME_LABELS[c.regimeTributario] || c.regimeTributario}</Badge> },
    {
      key: 'acoes', header: '', className: 'w-24',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Link to={`/companies/${c._id}/edit`}>
            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c._id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (company: any) => (
    <ListItemCard
      title={company.razaoSocial}
      subtitle={
        <>
          <span>{formatCnpj(company.cnpj)}</span>
          <Badge variant="neutral">{REGIME_LABELS[company.regimeTributario] || company.regimeTributario}</Badge>
          {company.nomeFantasia && <span>{company.nomeFantasia}</span>}
        </>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link to={`/companies/${company._id}/edit`}>
            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(company._id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas do escritorio"
        actions={
          <Link to="/companies/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razao social, CNPJ..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={3} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa cadastrada"
          description="Comece cadastrando a primeira empresa"
          hint="Tenha o cartao CNPJ em maos para agilizar"
          action={
            <Link to="/companies/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Empresa
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.data || []}
            keyExtractor={(c: any) => c._id}
            mobileCard={renderMobileCard}
          />
          <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCompany.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
          }
        }}
        variant="destructive"
        title="Remover empresa"
        description="Esta acao e irreversivel. Todos os dados contabeis vinculados serao perdidos."
        confirmLabel="Remover"
        loading={deleteCompany.isPending}
      />
    </div>
  );
}

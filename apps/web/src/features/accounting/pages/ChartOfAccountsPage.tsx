import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { HelpTooltip } from '@/components/molecules/help-tooltip';
import { GLOSSARY } from '@/lib/accounting-glossary';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { useAccountTree } from '../hooks/useAccounting';
import { AccountNode } from '../components/account-node';

function ChartContent({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const { data: tree, isLoading } = useAccountTree(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Plano de Contas <HelpTooltip help={GLOSSARY.planoDeContas} /></span>}
        description="Estrutura hierarquica de contas contabeis da empresa, organizada por grupos (Ativo, Passivo, Receita, Despesa)"
        actions={
          <Button onClick={() => navigate(`/accounting/accounts/new?companyId=${companyId}`)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5 text-warning" /> Sintetica
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-info" /> Analitica
              </span>
              <span>D = Devedora / C = Credora</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={4} />
          ) : tree && tree.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="space-y-0.5">
                {tree.map((account) => (
                  <AccountNode key={account._id} account={account} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">Nenhuma conta cadastrada</p>
              <p className="text-sm">Crie contas manualmente ou importe o plano referencial RFB</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ChartOfAccountsPage() {
  return <CompanyRequired>{(companyId) => <ChartContent companyId={companyId} />}</CompanyRequired>;
}

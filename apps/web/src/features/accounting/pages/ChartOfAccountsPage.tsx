import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, FolderOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccountTree } from '../hooks/useAccounting';
import { Account } from '../services/accounting.service';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AccountNode({ account, depth = 0 }: { account: Account; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 hover:bg-accent rounded text-sm cursor-pointer',
          account.isAnalytical ? 'text-foreground' : 'font-medium',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}

        {account.isAnalytical ? (
          <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        ) : (
          <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}

        <span className="text-muted-foreground font-mono text-xs w-24 shrink-0">
          {account.codigo}
        </span>
        <span className="truncate">{account.nome}</span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          {account.natureza === 'devedora' ? 'D' : 'C'}
        </span>
      </div>

      {expanded &&
        hasChildren &&
        account.children!.map((child) => (
          <AccountNode key={child._id} account={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function ChartOfAccountsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const { data: tree, isLoading } = useAccountTree(companyId);

  if (!companyId) {
    return (
      <div className="text-muted-foreground">
        Selecione uma empresa nos parametros da URL (?companyId=...)
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground">Estrutura hierarquica de contas contabeis</p>
        </div>
        <Button onClick={() => navigate(`/accounting/accounts/new?companyId=${companyId}`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> Sintetica
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-blue-500" /> Analitica
              </span>
              <span>D = Devedora / C = Credora</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Carregando...</div>
          ) : tree && tree.length > 0 ? (
            <div className="space-y-0.5">
              {tree.map((account) => (
                <AccountNode key={account._id} account={account} />
              ))}
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

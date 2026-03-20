import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '../services/accounting.service';

interface AccountNodeProps {
  account: Account;
  depth?: number;
}

export function AccountNode({ account, depth = 0 }: AccountNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 hover:bg-accent rounded text-sm cursor-pointer transition-colors',
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
          <FileText className="h-3.5 w-3.5 text-info shrink-0" />
        ) : (
          <FolderOpen className="h-3.5 w-3.5 text-warning shrink-0" />
        )}

        <span className="text-muted-foreground font-mono text-xs w-24 shrink-0">{account.codigo}</span>
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

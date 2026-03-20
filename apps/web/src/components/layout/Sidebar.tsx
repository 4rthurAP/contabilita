import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  FileText,
  Users,
  Landmark,
  Package,
  Clock,
  Shield,
  Globe,
  Send,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Empresas', href: '/companies', icon: Building2 },
  {
    name: 'Contabilidade',
    href: '/accounting',
    icon: BookOpen,
    children: [
      { name: 'Plano de Contas', href: '/accounting' },
      { name: 'Lancamentos', href: '/accounting/journal-entries' },
      { name: 'Razao', href: '/accounting/ledger' },
      { name: 'Balancete', href: '/accounting/trial-balance' },
      { name: 'Balanco Patrimonial', href: '/accounting/balanco' },
      { name: 'DRE', href: '/accounting/dre' },
    ],
  },
  {
    name: 'Escrita Fiscal',
    href: '/fiscal',
    icon: FileText,
    children: [
      { name: 'Notas Fiscais', href: '/fiscal/invoices' },
      { name: 'Apuracao', href: '/fiscal/assessment' },
      { name: 'Guias', href: '/fiscal/payments' },
    ],
  },
  {
    name: 'Folha de Pagamento',
    href: '/payroll',
    icon: Users,
    children: [
      { name: 'Folhas Mensais', href: '/payroll/runs' },
      { name: 'Funcionarios', href: '/payroll/employees' },
    ],
  },
  { name: 'LALUR', href: '/lalur', icon: Landmark },
  { name: 'Patrimonio', href: '/assets', icon: Package },
  { name: 'Atualizar', href: '/tax-update', icon: Clock },
  { name: 'Auditoria', href: '/audit', icon: Shield },
  { name: 'Portal Cliente', href: '/client-portal', icon: Globe },
  { name: 'Obrigacoes', href: '/obligations', icon: Send },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <span className={cn('font-bold text-lg text-primary', !sidebarOpen && 'hidden')}>
          Contabilita
        </span>
        {!sidebarOpen && <span className="font-bold text-lg text-primary mx-auto">C</span>}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navigation.map((item) => (
          <div key={item.href}>
            <NavLink
              to={item.href}
              end={!item.children}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center px-2',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </NavLink>
            {sidebarOpen &&
              item.children?.map((child) => (
                <NavLink
                  key={child.href}
                  to={child.href}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-1.5 pl-10 text-xs transition-colors',
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-accent-foreground',
                    )
                  }
                >
                  {child.name}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

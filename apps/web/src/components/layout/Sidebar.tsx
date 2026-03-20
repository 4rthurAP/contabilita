import { useState } from 'react';
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
  X,
  ClipboardList,
  ListTodo,
  Search,
  DollarSign,
  UserCheck,
  Calculator,
  Timer,
  FileBox,
  ChevronRight,
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
  {
    name: 'LALUR',
    href: '/lalur',
    icon: Landmark,
    children: [
      { name: 'Lancamentos', href: '/lalur' },
      { name: 'Calculo Lucro Real', href: '/lalur/calculate' },
    ],
  },
  { name: 'Patrimonio', href: '/assets', icon: Package },
  { name: 'Atualizar', href: '/tax-update', icon: Clock },
  { name: 'Auditoria', href: '/audit', icon: Shield },
  {
    name: 'Honorarios',
    href: '/honorarios',
    icon: DollarSign,
    children: [
      { name: 'Contratos', href: '/honorarios/contratos' },
      { name: 'Cobrancas', href: '/honorarios/cobrancas' },
      { name: 'Fluxo de Caixa', href: '/honorarios/fluxo-caixa' },
    ],
  },
  { name: 'Portal Cliente', href: '/portal', icon: Globe },
  { name: 'Portal Empregado', href: '/employee-portal', icon: UserCheck },
  { name: 'CCT', href: '/cct', icon: Calculator },
  {
    name: 'Custos',
    href: '/custos',
    icon: Timer,
    children: [
      { name: 'Apontamento', href: '/custos/time-tracking' },
      { name: 'Analise', href: '/custos/analysis' },
    ],
  },
  { name: 'Obrigacoes', href: '/obligations', icon: Send },
  { name: 'Protocolo', href: '/protocolo', icon: FileBox },
  { name: 'Registro', href: '/registro', icon: ClipboardList },
  {
    name: 'Administrar',
    href: '/administrar',
    icon: ListTodo,
    children: [
      { name: 'Tarefas', href: '/administrar/tarefas' },
      { name: 'Produtividade', href: '/administrar/produtividade' },
    ],
  },
  { name: 'Busca NF-e', href: '/busca-nfe', icon: Search },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
];

function SidebarContent({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (href: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  return (
    <nav className="flex-1 overflow-y-auto p-2" role="navigation" aria-label="Menu principal">
      {navigation.map((item) => {
        const hasChildren = !!item.children;
        const isOpen = openSections.has(item.href);

        return (
          <div key={item.href}>
            {hasChildren && expanded ? (
              <button
                onClick={() => toggleSection(item.href)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[2.75rem] md:min-h-0',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                    isOpen && 'rotate-90',
                  )}
                />
              </button>
            ) : (
              <NavLink
                to={item.href}
                end={!hasChildren}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[2.75rem] md:min-h-0',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    !expanded && 'justify-center px-2',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {expanded && <span>{item.name}</span>}
              </NavLink>
            )}

            {expanded && hasChildren && (
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                {item.children!.map((child) => (
                  <NavLink
                    key={child.href}
                    to={child.href}
                    end
                    onClick={onNavigate}
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
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarLogo({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex h-14 items-center border-b px-4">
      <span className={cn('font-bold text-lg text-primary', !expanded && 'hidden')}>
        Contabilita
      </span>
      {!expanded && <span className="font-bold text-lg text-primary mx-auto">C</span>}
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        <SidebarLogo expanded={sidebarOpen} />
        <SidebarContent expanded={sidebarOpen} />
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 md:hidden',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-bold text-lg text-primary">Contabilita</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Fechar menu"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent expanded onNavigate={() => setMobileSidebarOpen(false)} />
      </aside>
    </>
  );
}

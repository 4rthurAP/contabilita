import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { useAppAbility } from '@/lib/ability';
import { navigation } from '@/lib/navigation.config';

function SidebarContent({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const ability = useAppAbility();

  const filteredNavigation = useMemo(() => {
    return navigation
      .filter((item) => ability.can('read', item.subject))
      .map((item) => {
        if (!item.children) return item;
        const filteredChildren = item.children.filter(
          (child) => ability.can('read', child.subject ?? item.subject),
        );
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      })
      .filter(Boolean) as typeof navigation;
  }, [ability]);

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
      {filteredNavigation.map((item) => {
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

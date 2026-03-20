import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          'md:ml-16',
          sidebarOpen && 'md:ml-64',
        )}
      >
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

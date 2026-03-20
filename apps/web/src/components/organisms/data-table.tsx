import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  mobileCard?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  footer?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  mobileCard,
  onRowClick,
  footer,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full', className)}>
      {/* Mobile: card-based list */}
      {mobileCard && (
        <div className="flex flex-col gap-3 md:hidden">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop: dense table */}
      <div className={cn('overflow-x-auto rounded-md border', mobileCard ? 'hidden md:block' : 'block')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-left text-xs font-medium text-muted-foreground',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-b last:border-0 transition-colors hover:bg-muted/30',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5',
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.className,
                    )}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t bg-muted/50 font-semibold">
                {footer}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

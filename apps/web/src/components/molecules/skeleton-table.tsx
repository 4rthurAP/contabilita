import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  const widths = ['60%', '40%', '75%', '50%', '45%', '65%', '55%', '35%'];

  return (
    <div className="w-full overflow-hidden rounded-md border">
      {/* Header */}
      <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: widths[i % widths.length] }} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 border-b px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={col}
              className="h-3.5 rounded"
              style={{ width: widths[(row + col) % widths.length] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

import { Button } from '@/components/ui/button';

interface SegmentedFilterOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedFilterProps<T extends string> {
  options: SegmentedFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  allLabel?: string;
}

export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  allLabel = 'Todas',
}: SegmentedFilterProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!value ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('' as T)}
      >
        {allLabel}
      </Button>
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

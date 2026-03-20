import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface YearMonthFilterProps {
  year: number;
  month: number;
  onYearChange: (v: number) => void;
  onMonthChange: (v: number) => void;
}

export function YearMonthFilter({ year, month, onYearChange, onMonthChange }: YearMonthFilterProps) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Ano</Label>
        <Input
          type="number"
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="w-24"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Mes</Label>
        <Input
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="w-20"
        />
      </div>
    </>
  );
}

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface HelpTooltipProps {
  help: string;
}

export function HelpTooltip({ help }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex cursor-help" tabIndex={-1}>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{help}</TooltipContent>
    </Tooltip>
  );
}

import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastVariant } from '@/lib/hooks/use-toast';

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-background text-foreground',
  success: 'border-success/30 bg-success-muted text-success-muted-foreground',
  destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-warning/30 bg-warning-muted text-warning-muted-foreground',
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertCircle,
  warning: AlertTriangle,
};

const variantRole: Record<ToastVariant, 'status' | 'alert'> = {
  default: 'status',
  success: 'status',
  destructive: 'alert',
  warning: 'alert',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm"
    >
      {toasts.map((toast) => {
        const variant = toast.variant || 'default';
        const Icon = variantIcons[variant];
        return (
          <div
            key={toast.id}
            role={variantRole[variant]}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in-bottom',
              variantStyles[variant],
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{toast.title}</div>
              {toast.description && (
                <div className="mt-1 text-xs opacity-80">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Fechar notificacao"
              className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

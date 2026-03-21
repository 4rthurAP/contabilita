import { useState, useCallback, type ReactNode } from 'react';
import { Upload, FileCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ImportStep {
  id: string;
  label: string;
}

export interface ImportFile {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

interface ImportWizardProps {
  title: string;
  description?: string;
  accept: string;
  multiple?: boolean;
  maxSize?: number;
  steps: ImportStep[];
  currentStep: number;
  files: ImportFile[];
  onFilesSelected: (files: File[]) => void;
  onProcess: () => void;
  onReset: () => void;
  processing?: boolean;
  resultSummary?: ReactNode;
  className?: string;
}

/**
 * Wizard multi-etapa para importacao de arquivos (XML, OFX, PFX, etc).
 * Exibe: zona de drag-and-drop → lista de arquivos → processamento → resultado.
 */
export function ImportWizard({
  title,
  description,
  accept,
  multiple = true,
  maxSize = 50 * 1024 * 1024,
  steps,
  currentStep,
  files,
  onFilesSelected,
  onProcess,
  onReset,
  processing = false,
  resultSummary,
  className,
}: ImportWizardProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.size <= maxSize,
      );
      if (dropped.length > 0) onFilesSelected(dropped);
    },
    [maxSize, onFilesSelected],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []).filter(
        (f) => f.size <= maxSize,
      );
      if (selected.length > 0) onFilesSelected(selected);
      e.target.value = '';
    },
    [maxSize, onFilesSelected],
  );

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 pt-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  i < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : i === currentStep
                      ? 'bg-primary/20 text-primary ring-1 ring-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {i < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs',
                  i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className={cn(
                  'h-px w-8',
                  i < currentStep ? 'bg-primary' : 'bg-border',
                )} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop zone */}
        {currentStep === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Aceitos: {accept} — Max: {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
            <label>
              <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span>Selecionar arquivos</span>
              </Button>
            </label>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {files.length} arquivo(s)
              </span>
              {successCount + errorCount > 0 && (
                <div className="flex gap-2">
                  {successCount > 0 && (
                    <Badge variant="success">{successCount} sucesso</Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="danger">{errorCount} erro(s)</Badge>
                  )}
                </div>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  {f.status === 'pending' && <FileCheck className="h-4 w-4 text-muted-foreground" />}
                  {f.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {f.status === 'success' && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {f.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  <span className="flex-1 truncate">{f.file.name}</span>
                  {f.message && (
                    <span className={cn(
                      'text-xs',
                      f.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {f.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result summary */}
        {resultSummary}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={onReset} disabled={processing}>
              Nova importacao
            </Button>
          )}
          {files.length > 0 && currentStep === 0 && (
            <Button onClick={onProcess} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Processar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

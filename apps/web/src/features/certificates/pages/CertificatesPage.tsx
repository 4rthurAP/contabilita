import { useState } from 'react';
import { ShieldCheck, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/molecules/page-header';
import { EmptyState } from '@/components/molecules/empty-state';
import { LoadingState } from '@/components/molecules/loading-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { FormField } from '@/components/molecules/form-field';
import { DateBR } from '@/components/atoms/DateBR';
import { DocumentNumber } from '@/components/atoms/DocumentNumber';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { CompanyRequired } from '@/components/molecules/company-required';
import { ConfirmDialog } from '@/components/molecules/confirm-dialog';
import {
  useCertificates,
  useUploadCertificate,
  useRemoveCertificate,
} from '../hooks/useCertificates';
import type { CertificateInfo } from '../services/certificate.service';

const statusMap = {
  valido: { label: 'Valido', variant: 'success' as const },
  expirando: { label: 'Expirando', variant: 'warning' as const, icon: AlertTriangle },
  expirado: { label: 'Expirado', variant: 'danger' as const },
  revogado: { label: 'Revogado', variant: 'danger' as const },
};

function CertificatesContent({ companyId }: { companyId: string }) {
  const { data: certificates, isLoading } = useCertificates(companyId);
  const uploadMutation = useUploadCertificate();
  const removeMutation = useRemoveCertificate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    await uploadMutation.mutateAsync({
      file,
      companyId,
      password,
      nome: nome || undefined,
    });
    setDialogOpen(false);
    setFile(null);
    setPassword('');
    setNome('');
  };

  const columns: Column<CertificateInfo>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (cert) => <span className="font-medium">{cert.nome}</span>,
    },
    {
      key: 'titular',
      header: 'Titular',
      render: (cert) => cert.titular,
      hideOnMobile: true,
    },
    {
      key: 'documento',
      header: 'CNPJ/CPF',
      render: (cert) => cert.documento ? <DocumentNumber value={cert.documento} /> : '—',
      hideOnMobile: true,
    },
    {
      key: 'validTo',
      header: 'Validade',
      sortable: true,
      render: (cert) => <DateBR value={cert.validTo} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (cert) => <StatusBadge status={cert.status} statusMap={statusMap} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (cert) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteId(cert._id);
          }}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Certificados Digitais"
        description="Gerencie os certificados A1/A3 usados para assinatura digital e comunicacao com o governo."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Certificado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de Certificado Digital</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="Arquivo PFX/P12">
                  <Input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </FormField>
                <FormField label="Senha do certificado">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha do arquivo PFX"
                  />
                </FormField>
                <FormField label="Nome (opcional)">
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Certificado Principal 2025"
                  />
                </FormField>
                <Button
                  onClick={handleUpload}
                  disabled={!file || !password || uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? 'Enviando...' : 'Enviar Certificado'}
                </Button>
                {uploadMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(uploadMutation.error as any)?.response?.data?.message ||
                      'Erro ao enviar certificado'}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {(!certificates || certificates.length === 0) ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum certificado cadastrado"
          description="Faca upload de um certificado digital A1 (.pfx) para habilitar assinaturas e integracao com o governo."
        />
      ) : (
        <DataTable
          columns={columns}
          data={certificates}
          keyExtractor={(cert) => cert._id}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        title="Remover certificado"
        description="Tem certeza que deseja remover este certificado? Esta acao nao pode ser desfeita."
        onConfirm={async () => {
          if (deleteId) {
            await removeMutation.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        variant="destructive"
        loading={removeMutation.isPending}
      />
    </div>
  );
}

export function CertificatesPage() {
  return (
    <CompanyRequired>
      {(companyId) => <CertificatesContent companyId={companyId} />}
    </CompanyRequired>
  );
}

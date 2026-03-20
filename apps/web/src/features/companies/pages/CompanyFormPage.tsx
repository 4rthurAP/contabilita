import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { FormField } from '@/components/molecules/form-field';
import { useCreateCompany, useUpdateCompany, useCompany } from '../hooks/useCompanies';
import { RegimeTributario } from '@contabilita/shared';
import { REGIME_OPTIONS } from '@/lib/constants';

const companySchema = z.object({
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve conter 14 digitos'),
  razaoSocial: z.string().min(2, 'Razao social obrigatoria'),
  nomeFantasia: z.string().optional(),
  regimeTributario: z.nativeEnum(RegimeTributario),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  endereco: z
    .object({
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      uf: z.string().optional(),
      codigoIbge: z.string().optional(),
    })
    .optional(),
});

type CompanyForm = z.infer<typeof companySchema>;

export function CompanyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { data: company } = useCompany(id || '');
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      regimeTributario: RegimeTributario.SimplesNacional,
    },
  });

  useEffect(() => {
    if (company && isEditing) {
      reset({
        cnpj: company.cnpj,
        razaoSocial: company.razaoSocial,
        nomeFantasia: company.nomeFantasia || '',
        regimeTributario: company.regimeTributario,
        inscricaoEstadual: company.inscricaoEstadual || '',
        inscricaoMunicipal: company.inscricaoMunicipal || '',
        endereco: company.endereco || {},
      });
    }
  }, [company, isEditing, reset]);

  const onSubmit = (data: CompanyForm) => {
    if (isEditing) {
      const { cnpj: _, ...updateData } = data;
      updateCompany.mutate(
        { id: id!, data: updateData as any },
        { onSuccess: () => navigate('/app/companies') },
      );
    } else {
      createCompany.mutate(data as any, { onSuccess: () => navigate('/app/companies') });
    }
  };

  const isPending = createCompany.isPending || updateCompany.isPending;
  const error = createCompany.error || updateCompany.error;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={isEditing ? 'Editar Empresa' : 'Nova Empresa'}
        description={isEditing ? 'Atualize os dados da empresa' : 'Cadastre uma nova empresa no escritorio'}
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="CNPJ" error={errors.cnpj?.message}>
                <Input placeholder="12345678000199" maxLength={14} disabled={isEditing} {...register('cnpj')} />
              </FormField>
              <FormField label="Regime Tributario">
                <Select {...register('regimeTributario')}>
                  {REGIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Razao Social" error={errors.razaoSocial?.message}>
              <Input placeholder="Empresa Exemplo Ltda" {...register('razaoSocial')} />
            </FormField>

            <FormField label="Nome Fantasia">
              <Input placeholder="Exemplo" {...register('nomeFantasia')} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Inscricao Estadual">
                <Input {...register('inscricaoEstadual')} />
              </FormField>
              <FormField label="Inscricao Municipal">
                <Input {...register('inscricaoMunicipal')} />
              </FormField>
            </div>

            <h3 className="text-sm font-semibold pt-4 border-t">Endereco</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="CEP">
                <Input placeholder="01001000" maxLength={8} {...register('endereco.cep')} />
              </FormField>
              <FormField label="Logradouro" className="sm:col-span-2">
                <Input {...register('endereco.logradouro')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="Numero">
                <Input {...register('endereco.numero')} />
              </FormField>
              <FormField label="Complemento">
                <Input {...register('endereco.complemento')} />
              </FormField>
              <FormField label="Bairro">
                <Input {...register('endereco.bairro')} />
              </FormField>
              <FormField label="UF">
                <Input maxLength={2} {...register('endereco.uf')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Cidade">
                <Input {...register('endereco.cidade')} />
              </FormField>
              <FormField label="Codigo IBGE">
                <Input {...register('endereco.codigoIbge')} />
              </FormField>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {(error as any).response?.data?.message || 'Erro ao salvar empresa'}
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/app/companies')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

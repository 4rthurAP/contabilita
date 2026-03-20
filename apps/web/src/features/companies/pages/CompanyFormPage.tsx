import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateCompany, useUpdateCompany, useCompany } from '../hooks/useCompanies';
import { RegimeTributario } from '@contabilita/shared';
import { useEffect } from 'react';

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

const REGIME_OPTIONS = [
  { value: RegimeTributario.SimplesNacional, label: 'Simples Nacional' },
  { value: RegimeTributario.LucroPresumido, label: 'Lucro Presumido' },
  { value: RegimeTributario.LucroReal, label: 'Lucro Real' },
  { value: RegimeTributario.Imune, label: 'Imune' },
  { value: RegimeTributario.Isenta, label: 'Isenta' },
];

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
        { id: id!, data: updateData },
        { onSuccess: () => navigate('/companies') },
      );
    } else {
      createCompany.mutate(data, { onSuccess: () => navigate('/companies') });
    }
  };

  const isPending = createCompany.isPending || updateCompany.isPending;
  const error = createCompany.error || updateCompany.error;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Atualize os dados da empresa' : 'Cadastre uma nova empresa no escritorio'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CNPJ</label>
                <Input
                  placeholder="12345678000199"
                  maxLength={14}
                  disabled={isEditing}
                  {...register('cnpj')}
                />
                {errors.cnpj && (
                  <p className="text-sm text-destructive">{errors.cnpj.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Regime Tributario</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('regimeTributario')}
                >
                  {REGIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Razao Social</label>
              <Input placeholder="Empresa Exemplo Ltda" {...register('razaoSocial')} />
              {errors.razaoSocial && (
                <p className="text-sm text-destructive">{errors.razaoSocial.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Fantasia</label>
              <Input placeholder="Exemplo" {...register('nomeFantasia')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Inscricao Estadual</label>
                <Input {...register('inscricaoEstadual')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Inscricao Municipal</label>
                <Input {...register('inscricaoMunicipal')} />
              </div>
            </div>

            <h3 className="text-sm font-semibold pt-4 border-t">Endereco</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CEP</label>
                <Input placeholder="01001000" maxLength={8} {...register('endereco.cep')} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Logradouro</label>
                <Input {...register('endereco.logradouro')} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero</label>
                <Input {...register('endereco.numero')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Complemento</label>
                <Input {...register('endereco.complemento')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bairro</label>
                <Input {...register('endereco.bairro')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">UF</label>
                <Input maxLength={2} {...register('endereco.uf')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Input {...register('endereco.cidade')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Codigo IBGE</label>
                <Input {...register('endereco.codigoIbge')} />
              </div>
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
              <Button type="button" variant="outline" onClick={() => navigate('/companies')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { useRegister } from '../hooks/useAuth';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 digitos'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { mutate, isPending, error } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => mutate(data);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Contabilita</CardTitle>
          <CardDescription>Crie sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nome completo" htmlFor="name" error={errors.name?.message}>
              <Input id="name" placeholder="Seu nome" {...register('name')} />
            </FormField>

            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
            </FormField>

            <FormField label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
              <Input id="cpf" placeholder="12345678901" maxLength={11} {...register('cpf')} />
            </FormField>

            <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" placeholder="Minimo 8 caracteres" {...register('password')} />
            </FormField>

            {error && (
              <p className="text-sm text-destructive">
                {(error as any).response?.data?.message || 'Erro ao registrar'}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Criar conta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ja tem conta?{' '}
              <Link to="/login" className="text-primary hover:underline transition-colors">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

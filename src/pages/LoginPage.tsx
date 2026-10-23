import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Field } from '../components/Field';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(undefined);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Algo deu errado. Tente novamente.');
    }
  });

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para continuar.">
      <form onSubmit={onSubmit} noValidate>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Field label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field label="Senha" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <button className="btn btn-primary btn-block" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p className="auth-switch">Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></p>
    </AuthLayout>
  );
}

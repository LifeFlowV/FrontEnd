import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Field } from '../components/Field';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Informe seu nome.').max(120, 'O nome deve ter no máximo 120 caracteres.'),
    email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72, 'A senha deve ter no máximo 72 caracteres.').regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, 'A senha deve ter ao menos uma letra e um número.'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não coincidem.' });
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(undefined);
    try {
      await signUp({ name, email, password });
      navigate('/', { replace: true, state: { startTutorial: true } });
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = error.fieldErrors ?? {};
        (['name', 'email', 'password'] as const).forEach((f) => fields[f] && setError(f, { message: fields[f] }));
        if (!Object.keys(fields).length) setFormError(error.message);
      } else {
        setFormError('Algo deu errado. Tente novamente.');
      }
    }
  });

  return (
    <AuthLayout title="Criar conta" subtitle="Leva menos de um minuto.">
      <form onSubmit={onSubmit} noValidate>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Field label="Nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Field label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field label="Senha" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres, com letras e números." error={errors.password?.message} {...register('password')} />
        <Field label="Confirmar senha" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <button className="btn btn-primary btn-block" disabled={isSubmitting}>{isSubmitting ? 'Criando…' : 'Criar conta'}</button>
      </form>
      <p className="auth-switch">Já tem conta? <Link to="/entrar">Entrar</Link></p>
    </AuthLayout>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field } from '../../components/Field';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { applyApiError } from '../../utils/forms';

const schema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72, 'A senha deve ter no máximo 72 caracteres.').regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, 'A senha deve ter ao menos uma letra e um número.'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'As senhas não coincidem.' });
type Data = z.infer<typeof schema>;

export function ChangePasswordPanel() {
  const toast = useToast();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<Data>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await api<void>('/auth/password', { method: 'POST', body: { currentPassword: d.currentPassword, newPassword: d.newPassword } });
      toast.success('Senha alterada.');
      reset();
    } catch (e) { setFormError(applyApiError(e, setError, ['currentPassword', 'newPassword'])); }
  });
  return (
    <section className="card" aria-labelledby="senha-title">
      <h2 id="senha-title">Alterar senha</h2>
      <form onSubmit={submit} noValidate style={{ maxWidth: 420 }}>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Field label="Senha atual" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Field label="Nova senha" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres, com letras e números." error={errors.newPassword?.message} {...register('newPassword')} />
        <Field label="Confirmar nova senha" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Alterar senha'}</button>
      </form>
    </section>
  );
}

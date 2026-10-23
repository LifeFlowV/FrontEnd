import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { accountTypeLabels, accountTypes, type Account, type AccountInput } from '../../types/account';
import { applyApiError } from '../../utils/forms';
import { formatDecimal, parseBRL, todayISO } from '../../utils/format';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da conta.').max(80, 'O nome deve ter no máximo 80 caracteres.'),
  type: z.enum(accountTypes),
  institution: z.string().trim().max(80, 'A instituição deve ter no máximo 80 caracteres.'),
  openingBalance: z.string().refine((v) => parseBRL(v) !== null, 'Valor inválido. Use vírgula para os centavos. Ex.: 1.234,56'),
  openingDate: z.string().min(1, 'Informe a data do saldo inicial.'),
});
type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Account;
  onSubmit: (input: AccountInput) => Promise<void>;
  onCancel: () => void;
}

const typeOptions = accountTypes.map((t) => ({ value: t, label: accountTypeLabels[t] }));

export function AccountForm({ initial, onSubmit, onCancel }: Props) {
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'CHECKING',
      institution: initial?.institution ?? '',
      openingBalance: formatDecimal(initial?.openingBalance ?? 0),
      openingDate: initial?.openingDate ?? todayISO(),
    },
  });

  const submit = handleSubmit(async (data) => {
    setFormError(undefined);
    try {
      await onSubmit({
        name: data.name,
        type: data.type,
        institution: data.institution || null,
        openingBalance: parseBRL(data.openingBalance) ?? 0,
        openingDate: data.openingDate,
      });
    } catch (error) {
      setFormError(applyApiError(error, setError, ['name', 'type', 'institution', 'openingBalance', 'openingDate']));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Field label="Nome da conta" autoFocus error={errors.name?.message} {...register('name')} />
      <SelectField label="Tipo" options={typeOptions} error={errors.type?.message} {...register('type')} />
      <Field label="Instituição financeira (opcional)" error={errors.institution?.message} {...register('institution')} />
      <div className="form-row">
        <Field label="Saldo inicial (R$)" inputMode="decimal" hint="Pode ser negativo. Ex.: 1.234,56" error={errors.openingBalance?.message} {...register('openingBalance')} />
        <Field label="Data do saldo inicial" type="date" error={errors.openingDate?.message} {...register('openingDate')} />
      </div>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : initial ? 'Salvar alterações' : 'Criar conta'}</button>
      </div>
    </form>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { useLookups } from '../../hooks/useLookups';
import type { TransferInput } from '../../types/transaction';
import { applyApiError } from '../../utils/forms';
import { parseBRL, todayISO } from '../../utils/format';

const schema = z.object({
  fromAccountId: z.string().min(1, 'Escolha a conta de origem.'),
  toAccountId: z.string().min(1, 'Escolha a conta de destino.'),
  amount: z.string().refine((v) => { const n = parseBRL(v); return n !== null && n > 0; }, 'Informe um valor maior que zero. Ex.: 1.234,56'),
  date: z.string().min(1, 'Informe a data.'),
  description: z.string().max(120, 'A descrição deve ter no máximo 120 caracteres.'),
}).refine((d) => d.fromAccountId !== d.toAccountId, { path: ['toAccountId'], message: 'Escolha contas diferentes.' });
type FormData = z.infer<typeof schema>;

export function TransferForm({ onSubmit, onCancel }: { onSubmit: (input: TransferInput) => Promise<void>; onCancel: () => void }) {
  const { accounts } = useLookups();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fromAccountId: accounts[0]?.id ?? '', toAccountId: accounts[1]?.id ?? '', amount: '', date: todayISO(), description: '' },
  });

  if (accounts.length < 2) return <p className="muted">Você precisa de pelo menos duas contas ativas para transferir.</p>;
  const options = accounts.map((a) => ({ value: a.id, label: a.name }));

  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({ fromAccountId: d.fromAccountId, toAccountId: d.toAccountId, amount: parseBRL(d.amount) ?? 0, date: d.date, description: d.description.trim() || null, notes: null });
    } catch (error) {
      setFormError(applyApiError(error, setError, ['fromAccountId', 'toAccountId', 'amount', 'date', 'description']));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <p className="muted">Transferências movimentam o saldo das duas contas e não contam como receita nem despesa.</p>
      <div className="form-row">
        <SelectField label="De" options={options} error={errors.fromAccountId?.message} {...register('fromAccountId')} />
        <SelectField label="Para" options={options} error={errors.toAccountId?.message} {...register('toAccountId')} />
      </div>
      <div className="form-row">
        <Field label="Valor (R$)" inputMode="decimal" autoFocus error={errors.amount?.message} {...register('amount')} />
        <Field label="Data" type="date" max={todayISO()} error={errors.date?.message} {...register('date')} />
      </div>
      <Field label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Transferindo…' : 'Transferir'}</button>
      </div>
    </form>
  );
}

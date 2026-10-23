import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { categoryOptions, useLookups } from '../../hooks/useLookups';
import type { Transaction, TransactionInput } from '../../types/transaction';
import { applyApiError } from '../../utils/forms';
import { formatDecimal, parseBRL, todayISO } from '../../utils/format';

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().trim().min(1, 'Informe a descrição.').max(120, 'A descrição deve ter no máximo 120 caracteres.'),
  amount: z.string().refine((v) => { const n = parseBRL(v); return n !== null && n > 0; }, 'Informe um valor maior que zero. Ex.: 1.234,56'),
  competenceDate: z.string().min(1, 'Informe a data de competência.'),
  settled: z.boolean(),
  settledDate: z.string(),
  dueDate: z.string(),
  accountId: z.string().min(1, 'Escolha a conta.'),
  categoryId: z.string(),
  paymentMethodId: z.string(),
  notes: z.string().max(500, 'As observações devem ter no máximo 500 caracteres.'),
  tagIds: z.array(z.string()),
});
type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Transaction;
  defaultType?: 'INCOME' | 'EXPENSE';
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ initial, defaultType = 'EXPENSE', onSubmit, onCancel }: Props) {
  const lookups = useLookups();
  const [formError, setFormError] = useState<string>();
  const editingSettled = initial?.status === 'SETTLED';
  const initialType = initial && (initial.type === 'INCOME' || initial.type === 'EXPENSE') ? initial.type : defaultType;

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialType,
      description: initial?.description ?? '',
      amount: initial ? formatDecimal(initial.amount) : '',
      competenceDate: initial?.competenceDate ?? todayISO(),
      settled: initial ? initial.status === 'SETTLED' : false,
      settledDate: initial?.settledDate ?? todayISO(),
      dueDate: initial?.dueDate ?? initial?.competenceDate ?? todayISO(),
      accountId: initial?.accountId ?? lookups.accounts[0]?.id ?? '',
      categoryId: initial?.categoryId ?? '',
      paymentMethodId: initial?.paymentMethodId ?? '',
      notes: initial?.notes ?? '',
      tagIds: initial?.tagIds ?? [],
    },
  });
  const type = watch('type');
  const settled = watch('settled');

  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({
        type: d.type,
        description: d.description,
        amount: parseBRL(d.amount) ?? 0,
        competenceDate: d.competenceDate,
        dueDate: d.settled ? null : d.dueDate || null,
        accountId: d.accountId,
        categoryId: d.categoryId || null,
        paymentMethodId: d.paymentMethodId || null,
        settled: d.settled,
        settledDate: d.settled ? d.settledDate || null : null,
        notes: d.notes.trim() || null,
        tagIds: d.tagIds,
      });
    } catch (error) {
      setFormError(applyApiError(error, setError, ['description', 'amount', 'competenceDate', 'accountId', 'categoryId', 'paymentMethodId', 'settledDate', 'notes']));
    }
  });

  if (lookups.accounts.length === 0) {
    return <p className="muted">Cadastre uma conta antes de lançar movimentações (Finanças → Contas).</p>;
  }

  const paymentOptions = [{ value: '', label: 'Não informada' }, ...lookups.methods.filter((m) => m.kind !== 'CREDIT_CARD').map((m) => ({ value: m.id, label: m.name }))];
  const categoryOpts = [{ value: '', label: 'Sem categoria' }, ...categoryOptions(lookups.categoryTree, type)];

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <fieldset className="segmented">
        <legend>Tipo</legend>
        <label><input type="radio" value="EXPENSE" disabled={!!initial} {...register('type')} /> <span>Despesa</span></label>
        <label><input type="radio" value="INCOME" disabled={!!initial} {...register('type')} /> <span>Receita</span></label>
      </fieldset>
      <Field label="Descrição" autoFocus error={errors.description?.message} {...register('description')} />
      <div className="form-row">
        <Field label="Valor (R$)" inputMode="decimal" error={errors.amount?.message} {...register('amount')} />
        <Field label="Data de competência" type="date" error={errors.competenceDate?.message} {...register('competenceDate')} />
      </div>
      <SelectField label="Conta" options={lookups.accounts.map((a) => ({ value: a.id, label: a.name }))} error={errors.accountId?.message} {...register('accountId')} />
      <div className="form-row">
        <SelectField label="Categoria" options={categoryOpts} error={errors.categoryId?.message} {...register('categoryId')} />
        <SelectField label="Forma de pagamento" options={paymentOptions} error={errors.paymentMethodId?.message} {...register('paymentMethodId')} />
      </div>
      <label className="check form-check">
        <input type="checkbox" disabled={editingSettled} {...register('settled')} />
        {type === 'INCOME' ? 'Já foi recebida' : 'Já foi paga'}
      </label>
      {settled ? (
        <Field label={type === 'INCOME' ? 'Data do recebimento' : 'Data do pagamento'} type="date" max={todayISO()} error={errors.settledDate?.message} {...register('settledDate')} />
      ) : (
        <Field label="Vencimento" type="date" hint="Enquanto não for liquidada, não altera o saldo atual." {...register('dueDate')} />
      )}
      {lookups.tags.length > 0 && (
        <fieldset className="picker">
          <legend>Etiquetas</legend>
          <div className="tag-checks">
            {lookups.tags.map((t) => (
              <label key={t.id} className="check"><input type="checkbox" value={t.id} {...register('tagIds')} /> {t.name}</label>
            ))}
          </div>
        </fieldset>
      )}
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : initial ? 'Salvar alterações' : 'Salvar'}</button>
      </div>
    </form>
  );
}

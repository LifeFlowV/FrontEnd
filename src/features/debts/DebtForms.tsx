import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { categoryOptions, useLookups } from '../../hooks/useLookups';
import type { Debt, DebtInput, DebtInstallment, PayInstallmentInput } from '../../types/debt';
import { applyApiError } from '../../utils/forms';
import { formatBRL, formatDecimal, parseBRL, todayISO } from '../../utils/format';

const money = (msg: string) => z.string().refine((v) => { const n = parseBRL(v); return n !== null && n > 0; }, msg);
const optMoney = z.string().refine((v) => v.trim() === '' || parseBRL(v) !== null, 'Valor inválido. Ex.: 12,50');
const optRate = z.string().refine((v) => v.trim() === '' || /^\d+([.,]\d{1,4})?$/.test(v.trim()), 'Use um número. Ex.: 1,99');
const rate = (v: string) => (v.trim() === '' ? null : Number(v.trim().replace(',', '.')));

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da dívida.').max(120, 'Máximo de 120 caracteres.'),
  creditor: z.string().trim().min(1, 'Informe o credor.').max(120, 'Máximo de 120 caracteres.'),
  categoryId: z.string(), paymentMethodId: z.string(),
  originalAmount: money('Informe um valor maior que zero. Ex.: 5.000,00'),
  contractDate: z.string().min(1, 'Informe a data.'), firstDueDate: z.string().min(1, 'Informe o primeiro vencimento.'),
  installments: z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 480, 'Informe de 1 a 480 parcelas.'),
  interestRate: optRate, penaltyRate: optRate,
  description: z.string().max(255, 'Máximo de 255 caracteres.'), notes: z.string().max(500, 'Máximo de 500 caracteres.'),
});
type Data = z.infer<typeof schema>;

export function DebtForm({ onSubmit, onCancel }: { onSubmit: (i: DebtInput) => Promise<void>; onCancel: () => void }) {
  const { categoryTree, methods } = useLookups();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Data>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', creditor: '', categoryId: '', paymentMethodId: '', originalAmount: '', contractDate: todayISO(), firstDueDate: todayISO(), installments: '1', interestRate: '', penaltyRate: '', description: '', notes: '' },
  });
  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({ name: d.name, creditor: d.creditor, categoryId: d.categoryId || null, description: d.description.trim() || null,
        originalAmount: parseBRL(d.originalAmount) ?? 0, contractDate: d.contractDate, firstDueDate: d.firstDueDate, installments: +d.installments,
        interestRate: rate(d.interestRate), penaltyRate: rate(d.penaltyRate), paymentMethodId: d.paymentMethodId || null, notes: d.notes.trim() || null });
    } catch (e) { setFormError(applyApiError(e, setError, ['name', 'creditor', 'categoryId', 'originalAmount', 'contractDate', 'firstDueDate', 'installments', 'interestRate', 'penaltyRate', 'paymentMethodId', 'description', 'notes'])); }
  });
  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-row">
        <Field label="Nome da dívida" autoFocus error={errors.name?.message} {...register('name')} />
        <Field label="Credor" error={errors.creditor?.message} {...register('creditor')} />
      </div>
      <div className="form-row">
        <Field label="Valor original (R$)" inputMode="decimal" error={errors.originalAmount?.message} {...register('originalAmount')} />
        <Field label="Parcelas" inputMode="numeric" error={errors.installments?.message} {...register('installments')} />
      </div>
      <div className="form-row">
        <Field label="Data de contratação" type="date" error={errors.contractDate?.message} {...register('contractDate')} />
        <Field label="Primeiro vencimento" type="date" error={errors.firstDueDate?.message} {...register('firstDueDate')} />
      </div>
      <div className="form-row">
        <Field label="Juros ao mês, % (opcional)" inputMode="decimal" hint="Com juros, o cronograma usa a tabela Price (parcela constante)." error={errors.interestRate?.message} {...register('interestRate')} />
        <Field label="Multa por atraso, % (opcional)" inputMode="decimal" hint="Só sugere a multa ao pagar parcelas atrasadas." error={errors.penaltyRate?.message} {...register('penaltyRate')} />
      </div>
      <div className="form-row">
        <SelectField label="Categoria" options={[{ value: '', label: 'Sem categoria' }, ...categoryOptions(categoryTree, 'EXPENSE')]} error={errors.categoryId?.message} {...register('categoryId')} />
        <SelectField label="Forma de pagamento" options={[{ value: '', label: 'Não informada' }, ...methods.filter((x) => x.kind !== 'CREDIT_CARD').map((x) => ({ value: x.id, label: x.name }))]} error={errors.paymentMethodId?.message} {...register('paymentMethodId')} />
      </div>
      <Field label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      <p className="muted small">Valores e cronograma não podem ser alterados depois. Se algo mudar (renegociação), registre ajustes ao pagar ou crie uma nova dívida.</p>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Criando…' : 'Criar dívida'}</button>
      </div>
    </form>
  );
}

const paySchema = z.object({ amount: money('Informe um valor maior que zero.'), accountId: z.string().min(1, 'Escolha a conta.'), paidDate: z.string().min(1, 'Informe a data.'), lateFee: optMoney, discount: optMoney, notes: z.string().max(255, 'Máximo de 255 caracteres.') });
type PayData = z.infer<typeof paySchema>;

export function PayInstallmentForm({ debt, installment, onSubmit, onCancel }: { debt: Debt; installment: DebtInstallment; onSubmit: (i: PayInstallmentInput) => Promise<void>; onCancel: () => void }) {
  const { accounts } = useLookups();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm<PayData>({
    resolver: zodResolver(paySchema),
    defaultValues: { amount: formatDecimal(installment.remaining), accountId: accounts[0]?.id ?? '', paidDate: todayISO(), lateFee: installment.suggestedPenalty > 0 ? formatDecimal(installment.suggestedPenalty) : '', discount: '', notes: '' },
  });
  const fee = parseBRL(watch('lateFee') ?? '') ?? 0;
  const discount = parseBRL(watch('discount') ?? '') ?? 0;
  const due = installment.remaining + fee - discount;
  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try { await onSubmit({ accountId: d.accountId, amount: parseBRL(d.amount) ?? 0, paidDate: d.paidDate, lateFee: d.lateFee.trim() ? parseBRL(d.lateFee) : null, discount: d.discount.trim() ? parseBRL(d.discount) : null, notes: d.notes.trim() || null }); }
    catch (e) { setFormError(applyApiError(e, setError, ['amount', 'accountId', 'paidDate', 'lateFee', 'discount', 'notes'])); }
  });
  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <p className="muted"><strong>{debt.name}</strong> · parcela {installment.number}/{debt.installmentsCount} · vence {installment.dueDate.split('-').reverse().join('/')}. Falta pagar {formatBRL(installment.remaining)}{fee || discount ? `; com os ajustes, ${formatBRL(due)}` : ''}.</p>
      <div className="form-row">
        <Field label="Valor pago agora (R$)" inputMode="decimal" hint="Pode ser parcial." error={errors.amount?.message} {...register('amount')} />
        <Field label="Data do pagamento" type="date" max={todayISO()} error={errors.paidDate?.message} {...register('paidDate')} />
      </div>
      <div className="form-row">
        <Field label="Multa/juros de atraso (R$)" inputMode="decimal" error={errors.lateFee?.message} {...register('lateFee')} />
        <Field label="Desconto (R$)" inputMode="decimal" error={errors.discount?.message} {...register('discount')} />
      </div>
      <SelectField label="Pagar com a conta" options={accounts.map((a) => ({ value: a.id, label: a.name }))} error={errors.accountId?.message} {...register('accountId')} />
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Registrando…' : 'Registrar pagamento'}</button>
      </div>
    </form>
  );
}

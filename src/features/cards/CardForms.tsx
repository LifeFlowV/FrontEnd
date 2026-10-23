import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { categoryOptions, useLookups } from '../../hooks/useLookups';
import type { CardInput, CreditCard, InvoiceDetail, PayInvoiceInput, PurchaseInput } from '../../types/card';
import { applyApiError } from '../../utils/forms';
import { formatBRL, formatDecimal, parseBRL, todayISO } from '../../utils/format';

const money = (msg: string) => z.string().refine((v) => { const n = parseBRL(v); return n !== null && n > 0; }, msg);
const day = z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 31, 'Informe um dia entre 1 e 31.');

const cardSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cartão.').max(80, 'Máximo de 80 caracteres.'),
  institution: z.string().trim().max(80, 'Máximo de 80 caracteres.'),
  brand: z.string().trim().max(30, 'Máximo de 30 caracteres.'),
  creditLimit: money('Informe um limite maior que zero. Ex.: 5.000,00'),
  closingDay: day, dueDay: day,
  paymentAccountId: z.string().min(1, 'Escolha a conta de pagamento.'),
  notes: z.string().max(500, 'Máximo de 500 caracteres.'),
});
type CardData = z.infer<typeof cardSchema>;

export function CardForm({ initial, onSubmit, onCancel }: { initial?: CreditCard; onSubmit: (i: CardInput) => Promise<void>; onCancel: () => void }) {
  const { accounts } = useLookups();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CardData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: initial?.name ?? '', institution: initial?.institution ?? '', brand: initial?.brand ?? '',
      creditLimit: initial ? formatDecimal(initial.creditLimit) : '', closingDay: String(initial?.closingDay ?? 10), dueDay: String(initial?.dueDay ?? 20),
      paymentAccountId: initial?.paymentAccountId ?? accounts[0]?.id ?? '', notes: initial?.notes ?? '',
    },
  });
  if (accounts.length === 0) return <p className="muted">Cadastre uma conta antes (Finanças → Contas): é dela que sai o pagamento da fatura.</p>;

  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({ name: d.name, institution: d.institution || null, brand: d.brand || null, creditLimit: parseBRL(d.creditLimit) ?? 0,
        closingDay: +d.closingDay, dueDay: +d.dueDay, paymentAccountId: d.paymentAccountId, notes: d.notes.trim() || null });
    } catch (e) { setFormError(applyApiError(e, setError, ['name', 'institution', 'brand', 'creditLimit', 'closingDay', 'dueDay', 'paymentAccountId', 'notes'])); }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Field label="Nome do cartão" autoFocus error={errors.name?.message} {...register('name')} />
      <div className="form-row">
        <Field label="Instituição (opcional)" error={errors.institution?.message} {...register('institution')} />
        <Field label="Bandeira (opcional)" error={errors.brand?.message} {...register('brand')} />
      </div>
      <Field label="Limite total (R$)" inputMode="decimal" error={errors.creditLimit?.message} {...register('creditLimit')} />
      <div className="form-row">
        <Field label="Dia de fechamento" inputMode="numeric" hint="Compras até este dia (inclusive) entram na fatura do mês." error={errors.closingDay?.message} {...register('closingDay')} />
        <Field label="Dia de vencimento" inputMode="numeric" hint="Se for menor ou igual ao fechamento, vence no mês seguinte." error={errors.dueDay?.message} {...register('dueDay')} />
      </div>
      <SelectField label="Conta usada para pagar a fatura" options={accounts.map((a) => ({ value: a.id, label: a.name }))} error={errors.paymentAccountId?.message} {...register('paymentAccountId')} />
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      {initial && <p className="muted small">Mudanças em fechamento e vencimento valem só para compras futuras; faturas já criadas mantêm suas datas.</p>}
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

const purchaseSchema = z.object({
  cardId: z.string().min(1, 'Escolha o cartão.'),
  description: z.string().trim().min(1, 'Informe a descrição.').max(120, 'Máximo de 120 caracteres.'),
  totalAmount: money('Informe um valor maior que zero. Ex.: 1.200,00'),
  installments: z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 120, 'Informe de 1 a 120 parcelas.'),
  purchaseDate: z.string().min(1, 'Informe a data da compra.'),
  categoryId: z.string(),
  notes: z.string().max(500, 'Máximo de 500 caracteres.'),
});
type PurchaseData = z.infer<typeof purchaseSchema>;

export function PurchaseForm({ cards, defaultCardId, onSubmit, onCancel }: { cards: CreditCard[]; defaultCardId?: string; onSubmit: (i: PurchaseInput) => Promise<void>; onCancel: () => void }) {
  const { categoryTree } = useLookups();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<PurchaseData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { cardId: defaultCardId ?? cards[0]?.id ?? '', description: '', totalAmount: '', installments: '1', purchaseDate: todayISO(), categoryId: '', notes: '' },
  });
  const total = parseBRL(watch('totalAmount') ?? '');
  const parts = +watch('installments');
  const preview = total !== null && total > 0 && parts >= 1 && parts <= 120 ? Math.floor((total * 100) / parts) / 100 : null;

  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({ cardId: d.cardId, description: d.description, totalAmount: parseBRL(d.totalAmount) ?? 0, installments: +d.installments,
        purchaseDate: d.purchaseDate, categoryId: d.categoryId || null, notes: d.notes.trim() || null });
    } catch (e) { setFormError(applyApiError(e, setError, ['cardId', 'description', 'totalAmount', 'installments', 'purchaseDate', 'categoryId', 'notes'])); }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <SelectField label="Cartão" options={cards.map((c) => ({ value: c.id, label: c.name }))} error={errors.cardId?.message} {...register('cardId')} />
      <Field label="Descrição" autoFocus error={errors.description?.message} {...register('description')} />
      <div className="form-row">
        <Field label="Valor total (R$)" inputMode="decimal" error={errors.totalAmount?.message} {...register('totalAmount')} />
        <Field label="Parcelas" inputMode="numeric" error={errors.installments?.message} {...register('installments')}
          hint={preview !== null ? `${parts}x de ${formatBRL(preview)} (o resto dos centavos vai para a última)` : undefined} />
      </div>
      <div className="form-row">
        <Field label="Data da compra" type="date" error={errors.purchaseDate?.message} {...register('purchaseDate')} />
        <SelectField label="Categoria" options={[{ value: '', label: 'Sem categoria' }, ...categoryOptions(categoryTree, 'EXPENSE')]} error={errors.categoryId?.message} {...register('categoryId')} />
      </div>
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Registrar compra'}</button>
      </div>
    </form>
  );
}

const paySchema = z.object({ amount: money('Informe um valor maior que zero.'), accountId: z.string(), paidDate: z.string().min(1, 'Informe a data.') });
type PayData = z.infer<typeof paySchema>;

export function PayInvoiceForm({ detail, defaultAccountId, onSubmit, onCancel }: { detail: InvoiceDetail; defaultAccountId: string; onSubmit: (i: PayInvoiceInput) => Promise<void>; onCancel: () => void }) {
  const { accounts } = useLookups();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PayData>({
    resolver: zodResolver(paySchema),
    defaultValues: { amount: formatDecimal(detail.summary.remaining), accountId: defaultAccountId, paidDate: todayISO() },
  });
  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try { await onSubmit({ accountId: d.accountId || null, amount: parseBRL(d.amount) ?? 0, paidDate: d.paidDate }); }
    catch (e) { setFormError(applyApiError(e, setError, ['amount', 'accountId', 'paidDate'])); }
  });
  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <p className="muted">Falta pagar {formatBRL(detail.summary.remaining)}. Você pode pagar o total ou uma parte.</p>
      <div className="form-row">
        <Field label="Valor (R$)" inputMode="decimal" error={errors.amount?.message} {...register('amount')} />
        <Field label="Data do pagamento" type="date" max={todayISO()} error={errors.paidDate?.message} {...register('paidDate')} />
      </div>
      <SelectField label="Pagar com a conta" options={accounts.map((a) => ({ value: a.id, label: a.name }))} error={errors.accountId?.message} {...register('accountId')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Pagando…' : 'Pagar fatura'}</button>
      </div>
    </form>
  );
}

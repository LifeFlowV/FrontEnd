import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck, Eye, EyeOff, Plus, Repeat, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmDialog, Dialog } from '../../components/Dialog';
import { Field, SelectField } from '../../components/Field';
import { InlineError, InlineLoading } from '../../components/ScreenMessage';
import { categoryOptions, useLookups } from '../../hooks/useLookups';
import { useAgendaMutations, useRecurringBills } from '../../hooks/useResources';
import { useToast } from '../../hooks/useToast';
import type { RecurrenceInput, RecurringBill, RecurringInput } from '../../types/agenda';
import { applyApiError, errorMessage } from '../../utils/forms';
import { describeRecurrence, formatBRL, formatDate, parseBRL, todayISO } from '../../utils/format';
import { RecurrenceFields } from './RecurrenceFields';

const schema = z.object({
  description: z.string().trim().min(1, 'Informe a descrição.').max(120, 'Máximo de 120 caracteres.'),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().refine((v) => { const n = parseBRL(v); return n !== null && n > 0; }, 'Informe um valor maior que zero. Ex.: 99,90'),
  accountId: z.string().min(1, 'Escolha a conta.'), categoryId: z.string(), paymentMethodId: z.string(),
  startDate: z.string().min(1, 'Informe a data inicial.'), notes: z.string().max(500, 'Máximo de 500 caracteres.'),
});
type Data = z.infer<typeof schema>;

function RecurringForm({ onSubmit, onCancel }: { onSubmit: (i: RecurringInput) => Promise<void>; onCancel: () => void }) {
  const { accounts, categoryTree, methods } = useLookups();
  const [formError, setFormError] = useState<string>();
  const [recurrence, setRecurrence] = useState<RecurrenceInput | null>({ frequency: 'MONTHLY', interval: 1, weekdays: [], monthMode: 'DAY_OF_MONTH', monthDay: null, until: null });
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<Data>({
    resolver: zodResolver(schema),
    defaultValues: { description: '', type: 'EXPENSE', amount: '', accountId: accounts[0]?.id ?? '', categoryId: '', paymentMethodId: '', startDate: todayISO(), notes: '' },
  });
  const type = watch('type');
  const submit = handleSubmit(async (d) => {
    if (!recurrence) { setFormError('Defina a repetição.'); return; }
    setFormError(undefined);
    try {
      await onSubmit({ description: d.description, type: d.type, amount: parseBRL(d.amount) ?? 0, accountId: d.accountId, categoryId: d.categoryId || null,
        paymentMethodId: d.paymentMethodId || null, startDate: d.startDate, recurrence, notes: d.notes.trim() || null });
    } catch (e) { setFormError(applyApiError(e, setError, ['description', 'type', 'amount', 'accountId', 'categoryId', 'paymentMethodId', 'startDate', 'notes'])); }
  });
  if (accounts.length === 0) return <p className="muted">Cadastre uma conta antes (Finanças → Contas).</p>;
  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <fieldset className="segmented"><legend>Tipo</legend>
        <label><input type="radio" value="EXPENSE" {...register('type')} /> <span>Despesa</span></label>
        <label><input type="radio" value="INCOME" {...register('type')} /> <span>Receita</span></label>
      </fieldset>
      <Field label="Descrição" autoFocus error={errors.description?.message} {...register('description')} />
      <div className="form-row">
        <Field label="Valor (R$)" inputMode="decimal" error={errors.amount?.message} {...register('amount')} />
        <Field label="Primeira ocorrência" type="date" error={errors.startDate?.message} {...register('startDate')} />
      </div>
      <SelectField label="Conta" options={accounts.map((a) => ({ value: a.id, label: a.name }))} error={errors.accountId?.message} {...register('accountId')} />
      <div className="form-row">
        <SelectField label="Categoria" options={[{ value: '', label: 'Sem categoria' }, ...categoryOptions(categoryTree, type)]} {...register('categoryId')} />
        <SelectField label="Forma de pagamento" options={[{ value: '', label: 'Não informada' }, ...methods.filter((m) => m.kind !== 'CREDIT_CARD').map((m) => ({ value: m.id, label: m.name }))]} {...register('paymentMethodId')} />
      </div>
      <RecurrenceFields value={recurrence} onChange={setRecurrence} startDate={watch('startDate')} />
      <p className="muted small">As ocorrências aparecem como previsão no calendário. A transação só é criada quando você liquida cada ocorrência.</p>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Criar obrigação'}</button>
      </div>
    </form>
  );
}

/** Obrigações e receitas recorrentes (internet todo dia 10, salário no último dia útil). */
export function RecurringPanel() {
  const query = useRecurringBills();
  const m = useAgendaMutations();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<RecurringBill | null>(null);
  const list = query.data ?? [];

  const settleNext = async (b: RecurringBill) => {
    if (!b.nextOccurrence) return;
    try { await m.settleRecurring.mutateAsync({ id: b.id, occurrence: b.nextOccurrence, settledDate: null }); toast.success(`Ocorrência de ${formatDate(b.nextOccurrence)} liquidada.`); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <section className="card" aria-labelledby="rec-title">
      <div className="page-header-row">
        <div><h2 id="rec-title"><Repeat size={18} aria-hidden="true" /> Obrigações recorrentes</h2><p className="muted">Previsões mensais, semanais ou anuais que alimentam o calendário e os totais previstos.</p></div>
        <button className="btn" onClick={() => setCreating(true)}><Plus size={16} aria-hidden="true" /> Nova obrigação</button>
      </div>
      {query.isLoading ? <InlineLoading label="Carregando…" /> : query.isError ? <InlineError message="Não foi possível carregar." onRetry={() => void query.refetch()} /> : list.length === 0 ? <p className="muted">Nenhuma obrigação recorrente.</p> : (
        <ul className="list">
          {list.map((b) => (
            <li key={b.id} className={`list-row${b.active ? '' : ' is-archived'}`}>
              <span className="list-main"><strong>{b.description}</strong><br /><span className="muted small">{describeRecurrence(b.recurrence)}{b.nextOccurrence ? ` · próxima ${formatDate(b.nextOccurrence)}` : ''}</span></span>
              <span className={`num-inline ${b.type === 'INCOME' ? 'pos' : 'neg'}`}>{b.type === 'INCOME' ? '+' : '−'} {formatBRL(b.amount)}</span>
              {b.active && b.nextOccurrence && <button className="btn btn-sm" onClick={() => void settleNext(b)}><CalendarCheck size={14} aria-hidden="true" /> {b.type === 'INCOME' ? 'Receber' : 'Pagar'} próxima</button>}
              <button className="icon-btn" aria-label={`${b.active ? 'Pausar' : 'Reativar'} ${b.description}`} title={b.active ? 'Pausar' : 'Reativar'} onClick={() => void m.setRecurringActive.mutateAsync({ id: b.id, active: !b.active })}>{b.active ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              <button className="icon-btn" aria-label={`Excluir ${b.description}`} title="Excluir" onClick={() => setToDelete(b)}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} title="Nova obrigação recorrente">
        {creating && <RecurringForm onCancel={() => setCreating(false)} onSubmit={async (input) => { await m.createRecurring.mutateAsync(input); toast.success('Obrigação criada.'); setCreating(false); }} />}
      </Dialog>
      <ConfirmDialog open={toDelete !== null} title="Excluir obrigação?" destructive confirmLabel="Excluir" busy={m.removeRecurring.isPending}
        message={<>A série <strong>{toDelete?.description}</strong> deixa de gerar previsões. As ocorrências já liquidadas continuam no histórico de transações.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => { if (!toDelete) return; try { await m.removeRecurring.mutateAsync(toDelete.id); toast.success('Obrigação excluída.'); } catch (e) { toast.error(errorMessage(e)); } finally { setToDelete(null); } }} />
    </section>
  );
}

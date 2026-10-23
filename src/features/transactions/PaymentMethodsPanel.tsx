import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog } from '../../components/Dialog';
import { Field, SelectField } from '../../components/Field';
import { InlineError, InlineLoading } from '../../components/ScreenMessage';
import { usePaymentMethodMutations, usePaymentMethods } from '../../hooks/useResources';
import { useToast } from '../../hooks/useToast';
import { paymentKindLabels, type PaymentMethod, type PaymentMethodInput, type PaymentMethodKind } from '../../types/transaction';
import { applyApiError, errorMessage } from '../../utils/forms';

const kinds = Object.keys(paymentKindLabels) as PaymentMethodKind[];
const schema = z.object({ name: z.string().trim().min(1, 'Informe o nome.').max(60, 'O nome deve ter no máximo 60 caracteres.'), kind: z.enum(kinds as [PaymentMethodKind, ...PaymentMethodKind[]]) });
type FormData = z.infer<typeof schema>;

function MethodForm({ initial, onSubmit, onCancel }: { initial?: PaymentMethod; onSubmit: (i: PaymentMethodInput) => Promise<void>; onCancel: () => void }) {
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: initial?.name ?? '', kind: initial?.kind ?? 'OTHER' } });
  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try { await onSubmit(d); } catch (e) { setFormError(applyApiError(e, setError, ['name', 'kind'])); }
  });
  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Field label="Nome" autoFocus error={errors.name?.message} {...register('name')} />
      <SelectField label="Tipo" hint="Define o comportamento (por exemplo, cartão de crédito é lançado em Cartões)." options={kinds.map((k) => ({ value: k, label: paymentKindLabels[k] }))} error={errors.kind?.message} {...register('kind')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export function PaymentMethodsPanel() {
  const query = usePaymentMethods(true);
  const { create, update, setActive } = usePaymentMethodMutations();
  const toast = useToast();
  const [form, setForm] = useState<{ method?: PaymentMethod } | null>(null);

  const save = async (input: PaymentMethodInput) => {
    if (form?.method) { await update.mutateAsync({ id: form.method.id, input }); toast.success('Forma de pagamento atualizada.'); }
    else { await create.mutateAsync(input); toast.success('Forma de pagamento criada.'); }
    setForm(null);
  };
  const toggle = async (m: PaymentMethod) => {
    try { await setActive.mutateAsync({ id: m.id, active: !m.active }); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <section className="card" aria-labelledby="formas">
      <div className="page-header-row">
        <div><h2 id="formas">Formas de pagamento</h2><p className="muted">Usadas ao lançar transações. Você pode criar as suas.</p></div>
        <button className="btn" onClick={() => setForm({})}><Plus size={16} aria-hidden="true" /> Nova forma</button>
      </div>
      {query.isLoading ? <InlineLoading label="Carregando…" /> : query.isError ? <InlineError message="Não foi possível carregar." onRetry={() => void query.refetch()} /> : (
        <ul className="list">
          {(query.data ?? []).map((m) => (
            <li key={m.id} className={`list-row${m.active ? '' : ' is-archived'}`}>
              <span className="list-main">{m.name}</span>
              <span className="chip">{paymentKindLabels[m.kind]}</span>
              {!m.active && <span className="chip"><EyeOff size={12} aria-hidden="true" /> Inativa</span>}
              <button className="icon-btn" aria-label={`Editar ${m.name}`} title="Editar" onClick={() => setForm({ method: m })}><Pencil size={16} /></button>
              <button className="icon-btn" aria-label={`${m.active ? 'Desativar' : 'Reativar'} ${m.name}`} title={m.active ? 'Desativar' : 'Reativar'} onClick={() => void toggle(m)}>{m.active ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={form !== null} onClose={() => setForm(null)} title={form?.method ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}>
        {form && <MethodForm initial={form.method} onSubmit={save} onCancel={() => setForm(null)} />}
      </Dialog>
    </section>
  );
}

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { Field, SelectField } from '../components/Field';
import { categoryOptions } from '../hooks/useLookups';
import { useBudgetMutations, useBudgets, useCategoryTree } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import { formatBRL, currentMonth, parseBRL } from '../utils/format';
import { errorMessage } from '../utils/forms';

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const budgets = useBudgets(month);
  const categories = useCategoryTree(false);
  const mutations = useBudgetMutations();
  const toast = useToast();
  const options = categoryOptions(categories.data ?? [], 'EXPENSE');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseBRL(limitAmount);
    if (!categoryId || amount === null || amount <= 0) {
      toast.error('Escolha uma categoria e informe um limite válido.');
      return;
    }
    try {
      await mutations.save.mutateAsync({ categoryId, month, limitAmount: amount });
      setLimitAmount('');
      toast.success('Orçamento salvo.');
    } catch (error) { toast.error(errorMessage(error)); }
  };

  const remove = async (id: string) => {
    try { await mutations.remove.mutateAsync(id); toast.success('Orçamento removido.'); }
    catch (error) { toast.error(errorMessage(error)); }
  };

  return <>
    <header className="page-header page-header-row">
      <div><h1>Orçamentos mensais</h1><p className="muted">Defina limites por categoria. Despesas liquidadas e parcelas de cartão entram no mês em que foram pagas ou vencem.</p></div>
      <Field label="Mês" type="month" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} />
    </header>

    <form className="card budget-form" onSubmit={(event) => void save(event)}>
      <SelectField label="Categoria de despesa" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} options={[{ value: '', label: 'Selecione uma categoria' }, ...options]} />
      <Field label="Limite mensal (R$)" inputMode="decimal" value={limitAmount} onChange={(event) => setLimitAmount(event.target.value)} placeholder="Ex.: 800,00" />
      <button className="btn btn-primary" disabled={mutations.save.isPending || categories.isLoading}><Plus size={16} /> Salvar orçamento</button>
    </form>

    {categories.isError ? <InlineError message="Não foi possível carregar categorias." onRetry={() => void categories.refetch()} /> : null}
    {budgets.isLoading ? <InlineLoading label="Carregando orçamentos…" /> : budgets.isError ? <InlineError message="Não foi possível carregar os orçamentos." onRetry={() => void budgets.refetch()} /> : !budgets.data?.length ? (
      <section className="card"><EmptyState icon={<CheckCircle2 size={22} />} title="Nenhum orçamento neste mês"><p className="muted">Escolha uma categoria e defina um limite para começar.</p></EmptyState></section>
    ) : <ul className="budget-list">{budgets.data.map((budget) => {
      const pct = Math.min(100, Math.max(0, budget.percentageUsed));
      const statusClass = budget.status === 'EXCEEDED' ? 'neg' : budget.status === 'WARNING' ? 'budget-warning' : 'pos';
      return <li className="card budget-card" key={budget.id}>
        <div className="budget-head"><div><h2>{budget.categoryName}</h2><p className="muted small">Limite: {formatBRL(budget.limitAmount)}</p></div>
          <button className="icon-btn" aria-label={`Remover orçamento de ${budget.categoryName}`} title="Remover orçamento" onClick={() => void remove(budget.id)}><Trash2 size={17} /></button></div>
        <div className="progress" role="img" aria-label={`${Math.round(budget.percentageUsed)}% do orçamento usado`}><div className={statusClass} style={{ width: `${pct}%` }} /></div>
        <div className="budget-totals"><span>Usado <strong>{formatBRL(budget.spentAmount)}</strong> · {budget.percentageUsed.toFixed(1)}%</span><span className={statusClass}>{budget.remainingAmount >= 0 ? `Restam ${formatBRL(budget.remainingAmount)}` : `Excedido em ${formatBRL(-budget.remainingAmount)}`}</span></div>
        {budget.status === 'WARNING' && <p className="budget-alert"><AlertTriangle size={15} /> Você já usou pelo menos 80% deste limite.</p>}
        {budget.status === 'EXCEEDED' && <p className="budget-alert neg"><AlertTriangle size={15} /> O limite deste mês foi ultrapassado.</p>}
      </li>;
    })}</ul>}
  </>;
}

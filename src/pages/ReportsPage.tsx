import { useMemo, useState } from 'react';
import { Field, SelectField } from '../components/Field';
import { InlineError, InlineLoading } from '../components/ScreenMessage';
import { ChartCard, HorizontalBars, IncomeExpenseChart, LineSeries, PieByName, SingleBars, StackedObligations, monthLabel } from '../features/charts/Charts';
import { categoryOptions, useLookups } from '../hooks/useLookups';
import { useBalanceHistory, useFinancialReport, useObligations, useProductivity } from '../hooks/useResources';
import { formatBRL, toISODate } from '../utils/format';

type Tab = 'financial' | 'obligations' | 'productivity';
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toISODate(d); };

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('financial');
  return (
    <>
      <header className="page-header"><h1>Relatórios</h1><p className="muted">Calculados a partir dos seus dados reais, respeitando os filtros escolhidos.</p></header>
      <div className="tabs" role="tablist" aria-label="Relatórios">
        {([['financial', 'Financeiro'], ['obligations', 'Obrigações e dívidas'], ['productivity', 'Produtividade']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className="tab" onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'financial' ? <FinancialTab /> : tab === 'obligations' ? <ObligationsTab /> : <ProductivityTab />}
      </div>
    </>
  );
}

function FinancialTab() {
  const [from, setFrom] = useState(daysAgo(180));
  const [to, setTo] = useState(toISODate(new Date()));
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [methodId, setMethodId] = useState('');
  const lookups = useLookups();
  const q = useFinancialReport({ from, to, categoryId: categoryId || undefined, accountId: accountId || undefined, paymentMethodId: methodId || undefined });
  const balance = useBalanceHistory(12);
  const r = q.data;

  const rolled = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; children: { name: string; amount: number }[] }>();
    (r?.byCategory ?? []).forEach((c) => {
      const key = c.parentId ?? c.categoryId ?? 'none';
      const name = c.parentName ?? c.name;
      const g = map.get(key) ?? { name, amount: 0, children: [] };
      g.amount += c.amount;
      if (c.parentName) g.children.push({ name: c.name, amount: c.amount });
      map.set(key, g);
    });
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [r]);

  return (
    <>
      <section className="card filters" aria-label="Filtros do relatório">
        <Field label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Field label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <SelectField label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={[{ value: '', label: 'Todas' }, ...categoryOptions(lookups.categoryTree)]} />
        <SelectField label="Conta" value={accountId} onChange={(e) => setAccountId(e.target.value)} options={[{ value: '', label: 'Todas' }, ...lookups.accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        <SelectField label="Forma de pagamento" value={methodId} onChange={(e) => setMethodId(e.target.value)} options={[{ value: '', label: 'Todas' }, ...lookups.methods.map((m) => ({ value: m.id, label: m.name }))]} />
      </section>
      {q.isLoading ? <InlineLoading label="Gerando relatório…" /> : q.isError || !r ? <InlineError message="Não foi possível gerar o relatório. Verifique o período (máx. 5 anos)." onRetry={() => void q.refetch()} /> : (
        <>
          <section className="summary-grid"><div className="card stat"><span className="muted small">Receitas</span><strong className="pos">{formatBRL(r.totalIncome)}</strong></div>
            <div className="card stat"><span className="muted small">Despesas</span><strong className="neg">{formatBRL(r.totalExpense)}</strong><span className="small muted">Inclui parcelas de cartão pelo mês da fatura</span></div>
            <div className="card stat"><span className="muted small">Resultado</span><strong className={r.totalIncome - r.totalExpense < 0 ? 'neg' : 'pos'}>{formatBRL(r.totalIncome - r.totalExpense)}</strong></div></section>
          <div className="chart-grid">
            <ChartCard title="Receitas versus despesas por mês" columns={['Mês', 'Receitas', 'Despesas', 'Resultado']} rows={r.monthly.map((p) => [monthLabel(p.month), formatBRL(p.income), formatBRL(p.expense), formatBRL(p.result)])} empty={r.monthly.every((p) => p.income === 0 && p.expense === 0)}>
              <IncomeExpenseChart data={r.monthly} /></ChartCard>
            <ChartCard title="Gastos por forma de pagamento" columns={['Forma', 'Valor']} rows={r.byPaymentMethod.map((p) => [p.name, formatBRL(p.amount)])} empty={r.byPaymentMethod.length === 0}><PieByName data={r.byPaymentMethod} /></ChartCard>
            <ChartCard title="Gastos por cartão" columns={['Cartão', 'Valor']} rows={r.byCard.map((p) => [p.name, formatBRL(p.amount)])} empty={r.byCard.length === 0}><HorizontalBars data={r.byCard} /></ChartCard>
            <ChartCard title="Histórico de saldo (12 meses)" columns={['Mês', 'Saldo']} rows={(balance.data ?? []).map((p) => [monthLabel(p.month), formatBRL(p.value)])} empty={!balance.data}><LineSeries data={balance.data ?? []} name="Saldo" /></ChartCard>
          </div>
          <section className="card" aria-labelledby="cat-title"><h2 id="cat-title">Gastos por categoria e subcategoria</h2>
            {rolled.length === 0 ? <p className="muted">Sem despesas no período.</p> : (
              <div className="table-scroll"><table className="table table-compact"><caption className="sr-only">Gastos por categoria</caption>
                <thead><tr><th scope="col">Categoria</th><th scope="col" className="num">Valor</th><th scope="col" className="num">% das despesas</th></tr></thead>
                <tbody>{rolled.map((g) => (<>
                  <tr key={g.name}><td><strong>{g.name}</strong></td><td className="num">{formatBRL(g.amount)}</td><td className="num">{r.totalExpense ? ((g.amount / r.totalExpense) * 100).toFixed(1) : '0'}%</td></tr>
                  {g.children.map((c) => <tr key={`${g.name}-${c.name}`}><td className="indent">{c.name}</td><td className="num">{formatBRL(c.amount)}</td><td className="num muted">{r.totalExpense ? ((c.amount / r.totalExpense) * 100).toFixed(1) : '0'}%</td></tr>)}
                </>))}</tbody></table></div>)}
          </section>
        </>
      )}
    </>
  );
}

function ObligationsTab() {
  const q = useObligations(12);
  if (q.isLoading) return <InlineLoading label="Gerando relatório…" />;
  if (q.isError || !q.data) return <InlineError message="Não foi possível gerar o relatório." onRetry={() => void q.refetch()} />;
  const r = q.data;
  return (
    <>
      <section className="summary-grid"><div className="card stat"><span className="muted small">Dívidas: saldo restante</span><strong>{formatBRL(r.debtsRemaining)}</strong></div>
        <div className="card stat"><span className="muted small">Total previsto (12 meses)</span><strong>{formatBRL(r.future.reduce((s, m) => s + m.total, 0))}</strong></div></section>
      <div className="chart-grid">
        <ChartCard title="Obrigações futuras por mês" columns={['Mês', 'Dívidas', 'Faturas', 'Recorrentes', 'Outras', 'Total']} rows={r.future.map((m) => [monthLabel(m.month), formatBRL(m.debts), formatBRL(m.cards), formatBRL(m.recurring), formatBRL(m.other), formatBRL(m.total)])}><StackedObligations data={r.future} /></ChartCard>
        <ChartCard title="Valores pagos por mês (dívidas e faturas)" columns={['Mês', 'Pago']} rows={r.paidByMonth.map((p) => [monthLabel(p.month), formatBRL(p.value)])}><SingleBars data={r.paidByMonth} name="Pago" /></ChartCard>
        <ChartCard title="Dívidas restantes ao longo do tempo" columns={['Mês', 'Saldo devedor']} rows={r.debtsRemainingHistory.map((p) => [monthLabel(p.month), formatBRL(p.value)])} empty={r.debtsRemainingHistory.every((p) => p.value === 0)}><LineSeries data={r.debtsRemainingHistory} name="Saldo devedor" color="#B4234A" /></ChartCard>
      </div>
    </>
  );
}

function ProductivityTab() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(toISODate(new Date()));
  const q = useProductivity(from, to);
  const r = q.data;
  return (
    <>
      <section className="card filters" aria-label="Período"><Field label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Field label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></section>
      {q.isLoading ? <InlineLoading label="Gerando relatório…" /> : q.isError || !r ? <InlineError message="Não foi possível gerar o relatório (período máximo de 400 dias)." onRetry={() => void q.refetch()} /> : (
        <section className="summary-grid" aria-label="Produtividade">
          <div className="card stat"><span className="muted small">Taxa de conclusão</span><strong>{r.completionRate.toFixed(1)}%</strong><span className="small muted">{r.tasksDone} concluídas de {r.tasksDone + r.tasksPending}</span></div>
          <div className="card stat"><span className="muted small">Tarefas pendentes</span><strong>{r.tasksPending}</strong><span className="small muted">{r.tasksOverdue} em atraso</span></div>
          <div className="card stat"><span className="muted small">Horas planejadas</span><strong>{r.plannedHours.toFixed(1)} h</strong><span className="small muted">Tarefas e eventos com horário</span></div>
          <div className="card stat"><span className="muted small">Eventos realizados</span><strong className="pos">{r.eventsDone}</strong><span className="small muted">{r.eventsNotDone} não realizados · {r.eventsScheduled} sem registro · {r.eventsCanceled} cancelados</span></div>
        </section>
      )}
    </>
  );
}

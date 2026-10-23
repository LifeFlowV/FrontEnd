import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, CheckCircle2, CircleAlert, CreditCard, ListChecks, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { InlineError, InlineLoading } from '../components/ScreenMessage';
import { ChartCard, IncomeExpenseChart, LineSeries, PieByName, HorizontalBars, monthLabel } from '../features/charts/Charts';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useResources';
import { api } from '../services/api';
import { formatBRL, formatDate, formatLongDate, monthRange } from '../utils/format';

const currentMonth = () => new Date().toISOString().slice(0, 7);

function Stat({ label, value, tone, to, hint }: { label: string; value: string; tone?: 'pos' | 'neg'; to?: string; hint?: string }) {
  const body = (<><span className="muted small">{label}</span><strong className={tone}>{value}</strong>{hint && <span className="small muted">{hint}</span>}</>);
  return to ? <Link to={to} className="card stat stat-link">{body}</Link> : <div className="card stat">{body}</div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const dash = useDashboard(month);
  const health = useQuery({ queryKey: ['health'], queryFn: () => api<{ status: string }>('/actuator/health') });
  const d = dash.data;
  const range = useMemo(() => { const [y, m] = month.split('-').map(Number); return monthRange(new Date(y, m - 1, 1)); }, [month]);
  const txLink = (extra = '') => `/financas/transacoes?from=${range.from}&to=${range.to}${extra}`;

  return (
    <>
      <header className="page-header page-header-row">
        <div><h1>Olá, {user?.name.split(' ')[0]}</h1><p className="muted">{formatLongDate(new Date())}</p></div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="mes">Mês de referência</label>
          <input id="mes" type="month" value={month} max="2100-12" onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </div>
      </header>

      {health.isError || (health.data && health.data.status !== 'UP') ? (
        <p className="form-error" role="alert"><CircleAlert size={16} aria-hidden="true" /> API indisponível no momento.</p>
      ) : health.data ? <p className="status-row small muted"><CheckCircle2 size={14} aria-hidden="true" className="pos" /> API conectada</p> : null}

      {dash.isLoading ? <InlineLoading label="Calculando indicadores…" /> : dash.isError || !d ? <InlineError message="Não foi possível carregar o dashboard." onRetry={() => void dash.refetch()} /> : (
        <>
          <h2 className="section-title">Finanças</h2>
          <section className="summary-grid" aria-label="Indicadores financeiros">
            <Stat label="Saldo consolidado" value={formatBRL(d.consolidatedBalance)} tone={d.consolidatedBalance < 0 ? 'neg' : undefined} to="/financas/contas" hint="Contas ativas, hoje" />
            <Stat label="Receitas do mês" value={formatBRL(d.monthIncome)} tone="pos" to={txLink('&type=INCOME&status=SETTLED')} />
            <Stat label="Despesas do mês" value={formatBRL(d.monthExpense)} tone="neg" to={txLink('&type=EXPENSE&status=SETTLED')} hint="Inclui parcelas de cartão do mês" />
            <Stat label="Resultado do mês" value={formatBRL(d.monthResult)} tone={d.monthResult < 0 ? 'neg' : 'pos'} />
            <Stat label="Contas a pagar no mês" value={formatBRL(d.billsToPay)} to="/agenda/calendario" hint={`${d.billsToPayCount} item(ns) em aberto`} />
            <Stat label="Contas vencidas" value={formatBRL(d.overdueAmount)} tone={d.overdueCount > 0 ? 'neg' : undefined} to="/agenda/calendario" hint={`${d.overdueCount} item(ns) em atraso`} />
            <Stat label="Faturas de cartão abertas" value={formatBRL(d.openInvoices)} to="/financas/cartoes" />
            <Stat label="Dívidas: saldo restante" value={formatBRL(d.debtsRemaining)} to="/financas/dividas" />
            <Stat label="Previsto para pagar este mês" value={formatBRL(d.forecastThisMonth)} />
          </section>

          <div className="chart-grid">
            <ChartCard title="Receitas versus despesas" columns={['Mês', 'Receitas', 'Despesas']} rows={d.incomeVsExpense.map((p) => [monthLabel(p.month), formatBRL(p.income), formatBRL(p.expense)])}
              empty={d.incomeVsExpense.every((p) => p.income === 0 && p.expense === 0)}><IncomeExpenseChart data={d.incomeVsExpense} /></ChartCard>
            <ChartCard title="Despesas por categoria (mês)" columns={['Categoria', 'Valor']} rows={d.expenseByCategory.map((c) => [c.parentName ? `${c.parentName} › ${c.name}` : c.name, formatBRL(c.amount)])} empty={d.expenseByCategory.length === 0}>
              <HorizontalBars data={d.expenseByCategory.slice(0, 8).map((c) => ({ name: c.parentName ? `${c.parentName} › ${c.name}` : c.name, amount: c.amount }))} />
            </ChartCard>
            <ChartCard title="Evolução do saldo" columns={['Mês', 'Saldo']} rows={d.balanceEvolution.map((p) => [monthLabel(p.month), formatBRL(p.value)])}><LineSeries data={d.balanceEvolution} name="Saldo" /></ChartCard>
            <ChartCard title="Evolução das dívidas" columns={['Mês', 'Saldo devedor']} rows={d.debtEvolution.map((p) => [monthLabel(p.month), formatBRL(p.value)])} empty={d.debtEvolution.every((p) => p.value === 0)}>
              <LineSeries data={d.debtEvolution} name="Saldo devedor" color="#B4234A" />
            </ChartCard>
            <ChartCard title="Gastos por forma de pagamento (mês)" columns={['Forma', 'Valor']} rows={d.byPaymentMethod.map((p) => [p.name, formatBRL(p.amount)])} empty={d.byPaymentMethod.length === 0}><PieByName data={d.byPaymentMethod} /></ChartCard>
            <section className="card" aria-labelledby="next-title">
              <h2 id="next-title">Previsão dos próximos meses</h2>
              <ul className="list">{d.forecastNextMonths.map((f) => <li key={f.month} className="list-row"><span className="list-main">{monthLabel(f.month)}</span><span className="num-inline">{formatBRL(f.value)}</span></li>)}</ul>
              <p className="muted small">Contas, obrigações recorrentes, parcelas de dívidas e faturas ainda em aberto.</p>
            </section>
          </div>

          <h2 className="section-title">Produtividade</h2>
          <section className="summary-grid" aria-label="Indicadores de produtividade">
            <Stat label="Tarefas de hoje" value={String(d.tasksToday)} to="/agenda/tarefas" />
            <Stat label="Concluídas hoje" value={String(d.tasksDoneToday)} tone="pos" />
            <Stat label="Pendentes hoje" value={String(d.tasksPending)} />
            <Stat label="Atrasadas (90 dias)" value={String(d.tasksOverdue)} tone={d.tasksOverdue > 0 ? 'neg' : undefined} to="/agenda/tarefas" />
          </section>
          <div className="two-col">
            <section className="card" aria-labelledby="ev-title"><h2 id="ev-title"><CalendarClock size={18} aria-hidden="true" /> Próximos eventos (7 dias)</h2>
              {d.upcomingEvents.length === 0 ? <p className="muted">Nenhum evento nos próximos dias.</p> : <ul className="list">{d.upcomingEvents.map((e, i) => (
                <li key={i} className="list-row"><span className="list-main">{e.title}{e.conflict && <span className="chip chip-expense"> <AlertTriangle size={12} aria-hidden="true" /> conflito</span>}</span>
                  <span className="muted small">{formatDate(e.date)} {e.allDay ? '· dia inteiro' : e.startTime ? `· ${e.startTime.slice(0, 5)}` : ''}</span></li>))}</ul>}
              <Link to="/agenda/calendario">Abrir calendário</Link>
            </section>
            <section className="card" aria-labelledby="fin-title"><h2 id="fin-title"><Wallet size={18} aria-hidden="true" /> Compromissos financeiros (7 dias)</h2>
              {d.upcomingCommitments.length === 0 ? <p className="muted">Nenhum vencimento nos próximos dias.</p> : <ul className="list">{d.upcomingCommitments.map((c, i) => (
                <li key={i} className="list-row"><span className="list-main">{c.title}{c.overdue && <span className="chip chip-expense"> atrasado</span>}</span>
                  <span className="muted small">{formatDate(c.date)}</span><span className={`num-inline ${c.direction === 'IN' ? 'pos' : ''}`}>{c.amount !== null ? formatBRL(c.amount) : ''}</span></li>))}</ul>}
              <Link to="/financas/cartoes"><CreditCard size={14} aria-hidden="true" /> Cartões</Link> · <Link to="/financas/dividas">Dívidas</Link> · <Link to="/agenda/tarefas"><ListChecks size={14} aria-hidden="true" /> Tarefas</Link>
            </section>
          </div>
        </>
      )}
    </>
  );
}

import { ChevronDown, HandCoins, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { DebtForm, PayInstallmentForm } from '../features/debts/DebtForms';
import { useDebtMutations, useDebtSummary, useDebts } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import { debtStatusLabels, installmentStatusLabels, type Debt, type DebtInput, type DebtInstallment } from '../types/debt';
import { errorMessage } from '../utils/forms';
import { formatBRL, formatDate } from '../utils/format';

const monthLabel = (ym: string) => { const [y, m] = ym.split('-'); return `${m}/${y}`; };
type Dlg = { kind: 'new' } | { kind: 'pay'; debt: Debt; installment: DebtInstallment } | { kind: 'delete'; debt: Debt } | null;

export function DebtsPage() {
  const debts = useDebts();
  const summary = useDebtSummary(12);
  const m = useDebtMutations();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const list = debts.data ?? [];
  const s = summary.data;

  const remove = async (d: Debt) => {
    try { await m.remove.mutateAsync(d.id); toast.success('Dívida excluída.'); } catch (e) { toast.error(errorMessage(e)); } finally { setDlg(null); }
  };

  return (
    <>
      <header className="page-header page-header-row">
        <div><h1>Dívidas</h1><p className="muted">Cronograma de parcelas, pagamentos parciais e saldo restante calculado a partir de juros, ajustes e pagamentos.</p></div>
        <button className="btn btn-primary" onClick={() => setDlg({ kind: 'new' })}><Plus size={18} aria-hidden="true" /> Nova dívida</button>
      </header>

      {s && (
        <section className="summary-grid" aria-label="Indicadores de dívidas">
          <div className="card stat"><span className="muted small">Saldo restante</span><strong>{formatBRL(s.totalRemaining)}</strong><span className="small muted">de {formatBRL(s.totalDue)} devidos</span></div>
          <div className="card stat"><span className="muted small">Total pago</span><strong className="pos">{formatBRL(s.totalPaid)}</strong><span className="small muted">Original: {formatBRL(s.totalOriginal)}</span></div>
          <div className="card stat"><span className="muted small">Dívidas ativas</span><strong>{s.activeDebts}</strong><span className="small muted">{s.remainingInstallments} parcelas restantes</span></div>
          <div className="card stat"><span className="muted small">Vencido</span><strong className={s.overdueAmount > 0 ? 'neg' : ''}>{formatBRL(s.overdueAmount)}</strong><span className="small muted">{s.overdueInstallments} parcela(s) em atraso</span></div>
        </section>
      )}

      {s && s.forecast.some((f) => f.planned > 0 || f.paid > 0) && (
        <section className="card" aria-labelledby="prev">
          <h2 id="prev">Previsão mensal</h2>
          <div className="table-scroll"><table className="table table-compact">
            <caption className="sr-only">Previsto e pago por mês</caption>
            <thead><tr><th scope="col">Mês</th><th scope="col" className="num">Previsto a pagar</th><th scope="col" className="num">Efetivamente pago</th></tr></thead>
            <tbody>{s.forecast.filter((f) => f.planned > 0 || f.paid > 0).map((f) => (
              <tr key={f.month}><td>{monthLabel(f.month)}</td><td className="num">{formatBRL(f.planned)}</td><td className="num pos">{formatBRL(f.paid)}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="muted small">O previsto do primeiro mês inclui parcelas vencidas que continuam em aberto.</p>
        </section>
      )}

      {debts.isLoading ? <InlineLoading label="Carregando dívidas…" /> : debts.isError ? <InlineError message="Não foi possível carregar as dívidas." onRetry={() => void debts.refetch()} /> : list.length === 0 ? (
        <div className="card"><EmptyState icon={<HandCoins size={22} />} title="Nenhuma dívida cadastrada">
          <p className="muted">Cadastre empréstimos, financiamentos ou acordos para acompanhar parcelas e saldo restante.</p>
          <button className="btn btn-primary" onClick={() => setDlg({ kind: 'new' })}><Plus size={18} aria-hidden="true" /> Criar primeira dívida</button>
        </EmptyState></div>
      ) : (
        <ul className="tree">
          {list.map((d) => {
            const pct = d.totalDue > 0 ? (d.totalPaid / d.totalDue) * 100 : 0;
            const expanded = open === d.id;
            return (
              <li key={d.id} className="card tree-group">
                <div className="tree-head">
                  <div className="list-main"><h2>{d.name}</h2><p className="muted small">{d.creditor} · {d.paidInstallments}/{d.installmentsCount} parcelas pagas{d.nextDueDate ? ` · próximo vencimento ${formatDate(d.nextDueDate)}` : ''}</p></div>
                  <span className={`chip ${d.status === 'OVERDUE' ? 'chip-expense' : d.status === 'PAID' ? 'chip-income' : ''}`}>{debtStatusLabels[d.status]}</span>
                  <div className="debt-amount"><strong>{formatBRL(d.remaining)}</strong><span className="muted small">restante</span></div>
                  <button className="btn btn-sm" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : d.id)}>Parcelas <ChevronDown size={14} aria-hidden="true" className="chevron" /></button>
                  <button className="icon-btn" aria-label={`Excluir dívida ${d.name}`} title="Excluir" onClick={() => setDlg({ kind: 'delete', debt: d })}><Trash2 size={16} /></button>
                </div>
                <div className="progress" role="img" aria-label={`${Math.round(pct)}% pago`}><div style={{ width: `${Math.min(100, pct)}%` }} /></div>
                {expanded && (
                  <div className="table-scroll"><table className="table table-compact">
                    <caption className="sr-only">Parcelas de {d.name}</caption>
                    <thead><tr><th scope="col">Nº</th><th scope="col">Vencimento</th><th scope="col" className="num">Principal</th><th scope="col" className="num">Juros</th><th scope="col" className="num">Ajustes</th><th scope="col" className="num">Total</th><th scope="col" className="num">Pago</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
                    <tbody>{d.installments.map((i) => (
                      <tr key={i.id}>
                        <td>{i.number}</td><td>{formatDate(i.dueDate)}</td><td className="num">{formatBRL(i.principal)}</td><td className="num">{formatBRL(i.interest)}</td>
                        <td className="num">{formatBRL(i.adjustment)}</td><td className="num">{formatBRL(i.totalDue)}</td><td className="num">{formatBRL(i.paid)}</td>
                        <td><span className={`chip ${i.status === 'OVERDUE' ? 'chip-expense' : i.status === 'PAID' ? 'chip-income' : ''}`}>{installmentStatusLabels[i.status]}</span></td>
                        <td>{i.status !== 'PAID' && <button className="btn btn-sm" onClick={() => setDlg({ kind: 'pay', debt: d, installment: i })}>Pagar</button>}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dlg?.kind === 'new'} onClose={() => setDlg(null)} title="Nova dívida">
        {dlg?.kind === 'new' && <DebtForm onCancel={() => setDlg(null)} onSubmit={async (input: DebtInput) => { await m.create.mutateAsync(input); toast.success('Dívida criada com o cronograma de parcelas.'); setDlg(null); }} />}
      </Dialog>
      <Dialog open={dlg?.kind === 'pay'} onClose={() => setDlg(null)} title="Registrar pagamento">
        {dlg?.kind === 'pay' && <PayInstallmentForm debt={dlg.debt} installment={dlg.installment} onCancel={() => setDlg(null)}
          onSubmit={async (input) => { await m.pay.mutateAsync({ installmentId: dlg.installment.id, input }); toast.success('Pagamento registrado.'); setDlg(null); }} />}
      </Dialog>
      <ConfirmDialog open={dlg?.kind === 'delete'} title="Excluir dívida?" destructive confirmLabel="Excluir" busy={m.remove.isPending}
        message={<>A dívida <strong>{dlg?.kind === 'delete' ? dlg.debt.name : ''}</strong> e seu cronograma serão removidos. Não é possível excluir dívidas que já têm pagamentos.</>}
        onCancel={() => setDlg(null)} onConfirm={() => dlg?.kind === 'delete' && void remove(dlg.debt)} />
    </>
  );
}

import {
  AlertTriangle, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Ban, CheckCircle2, Clock, Pencil, Plus, Trash2, Undo2, Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { DateDialog } from '../components/DateDialog';
import { Field, SelectField } from '../components/Field';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { RecurringPanel } from '../features/agenda/RecurringPanel';
import { TransactionForm } from '../features/transactions/TransactionForm';
import { TransferForm } from '../features/transactions/TransferForm';
import { useDebounced } from '../hooks/useDebounced';
import { categoryOptions, useLookups } from '../hooks/useLookups';
import { useTransactionMutations, useTransactionSummary, useTransactions } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import type { Transaction, TransactionFilters, TransactionInput, TransactionStatus, TransactionType } from '../types/transaction';
import { errorMessage } from '../utils/forms';
import { formatBRL, formatDate, monthRange } from '../utils/format';

type Dialogs =
  | { kind: 'form'; tx?: Transaction; type?: 'INCOME' | 'EXPENSE' }
  | { kind: 'transfer' }
  | { kind: 'settle' | 'reverse' | 'cancel' | 'delete'; tx: Transaction }
  | null;

const statusLabel: Record<TransactionStatus, string> = { PLANNED: 'Planejada', SETTLED: 'Liquidada', CANCELED: 'Cancelada' };
const isCredit = (t: TransactionType) => t === 'INCOME' || t === 'TRANSFER_IN';

export function TransactionsPage() {
  const [params] = useSearchParams();
  const initialRange = useMemo(() => monthRange(), []);
  const [from, setFrom] = useState(params.get('from') ?? initialRange.from);
  const [to, setTo] = useState(params.get('to') ?? initialRange.to);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [type, setType] = useState(params.get('type') ?? '');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<Dialogs>(null);

  const q = useDebounced(search.trim());
  const filters: TransactionFilters = {
    from: from || undefined, to: to || undefined, accountId: accountId || undefined, categoryId: categoryId || undefined,
    paymentMethodId: methodId || undefined, status: (status || undefined) as TransactionStatus | undefined,
    type: (type || undefined) as TransactionType | undefined, q: q || undefined,
  };
  const list = useTransactions({ ...filters, page, size: 20, sort, dir });
  const summary = useTransactionSummary(filters);
  const lookups = useLookups();
  const m = useTransactionMutations();
  const toast = useToast();

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };
  const accountName = (id: string) => lookups.accounts.find((a) => a.id === id)?.name ?? '—';
  const methodName = (id: string | null) => (id ? lookups.methods.find((x) => x.id === id)?.name ?? '—' : '—');

  const run = async (action: () => Promise<unknown>, success: string) => {
    try { await action(); toast.success(success); } catch (e) { toast.error(errorMessage(e)); } finally { setDialog(null); }
  };

  const saveForm = async (input: TransactionInput) => {
    if (dialog?.kind === 'form' && dialog.tx) {
      await m.update.mutateAsync({ id: dialog.tx.id, input });
      toast.success('Transação atualizada.');
    } else {
      await m.create.mutateAsync(input);
      toast.success('Transação registrada.');
    }
    setDialog(null);
  };

  const toggleSort = (field: string) => {
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSort(field); setDir('desc'); }
    setPage(0);
  };
  const sortLabel = (field: string) => (sort === field ? (dir === 'asc' ? 'ascending' : 'descending') : 'none');

  const rows = list.data?.content ?? [];
  const selected = dialog && 'tx' in dialog ? dialog.tx : undefined;

  return (
    <>
      <header className="page-header page-header-row">
        <div>
          <h1>Transações</h1>
          <p className="muted">Receitas, despesas e transferências. Só as liquidadas alteram o saldo das contas.</p>
        </div>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => setDialog({ kind: 'form', type: 'EXPENSE' })}><Plus size={18} aria-hidden="true" /> Nova transação</button>
          <button className="btn" onClick={() => setDialog({ kind: 'transfer' })}><ArrowLeftRight size={16} aria-hidden="true" /> Transferir</button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Totais do filtro atual">
        <div className="card stat"><span className="muted small">Receitas liquidadas</span><strong className="pos">{formatBRL(summary.data?.income ?? 0)}</strong><span className="small muted">Previstas: {formatBRL(summary.data?.plannedIncome ?? 0)}</span></div>
        <div className="card stat"><span className="muted small">Despesas liquidadas</span><strong className="neg">{formatBRL(summary.data?.expense ?? 0)}</strong><span className="small muted">Previstas: {formatBRL(summary.data?.plannedExpense ?? 0)}</span></div>
        <div className="card stat"><span className="muted small">Resultado</span><strong className={(summary.data?.result ?? 0) < 0 ? 'neg' : 'pos'}>{formatBRL(summary.data?.result ?? 0)}</strong><span className="small muted">{summary.data?.count ?? 0} transações no filtro</span></div>
      </section>

      <section className="card filters" aria-label="Filtros">
        <Field label="De" type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} />
        <Field label="Até" type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} />
        <SelectField label="Conta" value={accountId} onChange={(e) => resetPage(setAccountId)(e.target.value)} options={[{ value: '', label: 'Todas' }, ...lookups.accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        <SelectField label="Categoria" value={categoryId} onChange={(e) => resetPage(setCategoryId)(e.target.value)} options={[{ value: '', label: 'Todas' }, ...categoryOptions(lookups.categoryTree)]} />
        <SelectField label="Forma de pagamento" value={methodId} onChange={(e) => resetPage(setMethodId)(e.target.value)} options={[{ value: '', label: 'Todas' }, ...lookups.methods.map((x) => ({ value: x.id, label: x.name }))]} />
        <SelectField label="Status" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)} options={[{ value: '', label: 'Todos' }, { value: 'PLANNED', label: 'Planejadas' }, { value: 'SETTLED', label: 'Liquidadas' }, { value: 'CANCELED', label: 'Canceladas' }]} />
        <SelectField label="Tipo" value={type} onChange={(e) => resetPage(setType)(e.target.value)} options={[{ value: '', label: 'Todos' }, { value: 'INCOME', label: 'Receitas' }, { value: 'EXPENSE', label: 'Despesas' }, { value: 'TRANSFER_OUT', label: 'Transferências (saídas)' }, { value: 'TRANSFER_IN', label: 'Transferências (entradas)' }]} />
        <Field label="Buscar na descrição" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Ex.: mercado" />
      </section>

      {list.isLoading ? (
        <InlineLoading label="Carregando transações…" />
      ) : list.isError ? (
        <InlineError message="Não foi possível carregar as transações." onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Wallet size={22} />} title="Nenhuma transação neste filtro">
            <p className="muted">Ajuste o período e os filtros ou registre uma nova movimentação.</p>
            <button className="btn btn-primary" onClick={() => setDialog({ kind: 'form', type: 'EXPENSE' })}><Plus size={18} aria-hidden="true" /> Nova transação</button>
          </EmptyState>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="table">
              <caption className="sr-only">Lista de transações</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={sortLabel('date')}><button className="th-btn" onClick={() => toggleSort('date')}>Data {sort === 'date' && (dir === 'asc' ? '↑' : '↓')}</button></th>
                  <th scope="col" aria-sort={sortLabel('description')}><button className="th-btn" onClick={() => toggleSort('description')}>Descrição {sort === 'description' && (dir === 'asc' ? '↑' : '↓')}</button></th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Conta</th>
                  <th scope="col">Pagamento</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num" aria-sort={sortLabel('amount')}><button className="th-btn" onClick={() => toggleSort('amount')}>Valor {sort === 'amount' && (dir === 'asc' ? '↑' : '↓')}</button></th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const credit = isCredit(t.type);
                  const dim = t.status === 'CANCELED' || t.reversed;
                  return (
                    <tr key={t.id} className={dim ? 'is-archived' : undefined}>
                      <td>{formatDate(t.competenceDate)}</td>
                      <td>
                        <div className="cell-main">{t.description}</div>
                        <div className="cell-flags">
                          {t.type.startsWith('TRANSFER') && <span className="chip"><ArrowLeftRight size={12} aria-hidden="true" /> Transferência</span>}
                          {t.reversed && <span className="chip"><Undo2 size={12} aria-hidden="true" /> Estornada</span>}
                          {t.reversalOfId && <span className="chip">Estorno</span>}
                          {t.sourceType && <span className="chip">Gerada pelo sistema</span>}
                          {t.overdue && <span className="chip chip-expense"><AlertTriangle size={12} aria-hidden="true" /> Atrasada</span>}
                        </div>
                      </td>
                      <td>{t.categoryId ? lookups.categoryNames.get(t.categoryId) ?? '—' : '—'}</td>
                      <td>{accountName(t.accountId)}</td>
                      <td>{methodName(t.paymentMethodId)}</td>
                      <td><span className="chip">{t.status === 'SETTLED' ? <CheckCircle2 size={12} aria-hidden="true" /> : t.status === 'CANCELED' ? <Ban size={12} aria-hidden="true" /> : <Clock size={12} aria-hidden="true" />} {statusLabel[t.status]}</span></td>
                      <td className={`num ${credit ? 'pos' : 'neg'}`}>
                        <span className="amt">{credit ? <ArrowDownLeft size={14} aria-hidden="true" /> : <ArrowUpRight size={14} aria-hidden="true" />}{credit ? '+' : '−'} {formatBRL(t.amount)}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {t.editable && <button className="icon-btn" aria-label={`Editar ${t.description}`} title="Editar" onClick={() => setDialog({ kind: 'form', tx: t })}><Pencil size={16} /></button>}
                          {t.editable && t.status === 'PLANNED' && <button className="icon-btn" aria-label={`Liquidar ${t.description}`} title="Marcar como paga/recebida" onClick={() => setDialog({ kind: 'settle', tx: t })}><CheckCircle2 size={16} /></button>}
                          {t.editable && t.status === 'PLANNED' && <button className="icon-btn" aria-label={`Cancelar ${t.description}`} title="Cancelar" onClick={() => setDialog({ kind: 'cancel', tx: t })}><Ban size={16} /></button>}
                          {t.status === 'SETTLED' && !t.reversed && !t.reversalOfId && !t.sourceType && <button className="icon-btn" aria-label={`Estornar ${t.description}`} title="Estornar" onClick={() => setDialog({ kind: 'reverse', tx: t })}><Undo2 size={16} /></button>}
                          {t.editable && t.status !== 'SETTLED' && <button className="icon-btn" aria-label={`Excluir ${t.description}`} title="Excluir" onClick={() => setDialog({ kind: 'delete', tx: t })}><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav className="pager" aria-label="Paginação">
            <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
            <span className="muted">Página {(list.data?.page ?? 0) + 1} de {Math.max(list.data?.totalPages ?? 1, 1)}</span>
            <button className="btn btn-sm" disabled={page + 1 >= (list.data?.totalPages ?? 1)} onClick={() => setPage(page + 1)}>Próxima</button>
          </nav>
        </div>
      )}

      <RecurringPanel />

      <Dialog open={dialog?.kind === 'form'} onClose={() => setDialog(null)} title={dialog?.kind === 'form' && dialog.tx ? 'Editar transação' : 'Nova transação'}>
        {dialog?.kind === 'form' && <TransactionForm initial={dialog.tx} defaultType={dialog.type} onSubmit={saveForm} onCancel={() => setDialog(null)} />}
      </Dialog>
      <Dialog open={dialog?.kind === 'transfer'} onClose={() => setDialog(null)} title="Transferir entre contas">
        {dialog?.kind === 'transfer' && <TransferForm onCancel={() => setDialog(null)} onSubmit={async (input) => { await m.transfer.mutateAsync(input); toast.success('Transferência realizada.'); setDialog(null); }} />}
      </Dialog>
      <DateDialog open={dialog?.kind === 'settle'} title="Marcar como liquidada" message={<>Informe quando <strong>{selected?.description}</strong> foi {selected?.type === 'INCOME' ? 'recebida' : 'paga'}. O saldo da conta será atualizado.</>} dateLabel="Data da liquidação" confirmLabel="Liquidar" busy={m.settle.isPending} onCancel={() => setDialog(null)} onConfirm={(date) => selected && void run(() => m.settle.mutateAsync({ id: selected.id, date }), 'Transação liquidada.')} />
      <DateDialog open={dialog?.kind === 'reverse'} title="Estornar transação" message={<>Será criada uma contrapartida que desfaz o efeito de <strong>{selected?.description}</strong> no saldo. O histórico é mantido e a operação não pode ser desfeita.</>} dateLabel="Data do estorno" confirmLabel="Estornar" min={selected?.settledDate ?? undefined} busy={m.reverse.isPending} onCancel={() => setDialog(null)} onConfirm={(date) => selected && void run(() => m.reverse.mutateAsync({ id: selected.id, date }), 'Transação estornada.')} />
      <ConfirmDialog open={dialog?.kind === 'cancel'} title="Cancelar transação?" message={<>A transação planejada <strong>{selected?.description}</strong> será marcada como cancelada.</>} confirmLabel="Cancelar transação" busy={m.cancel.isPending} onCancel={() => setDialog(null)} onConfirm={() => selected && void run(() => m.cancel.mutateAsync(selected.id), 'Transação cancelada.')} />
      <ConfirmDialog open={dialog?.kind === 'delete'} title="Excluir transação?" message={<>A transação <strong>{selected?.description}</strong> será excluída definitivamente.</>} confirmLabel="Excluir" destructive busy={m.remove.isPending} onCancel={() => setDialog(null)} onConfirm={() => selected && void run(() => m.remove.mutateAsync(selected.id), 'Transação excluída.')} />
    </>
  );
}

import { Archive, ArchiveRestore, Landmark, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { AccountForm } from '../features/accounts/AccountForm';
import { useAccountMutations, useAccounts } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import { accountTypeLabels, type Account, type AccountInput } from '../types/account';
import { errorMessage } from '../utils/forms';
import { formatBRL, formatDate } from '../utils/format';

type FormState = { mode: 'create' } | { mode: 'edit'; account: Account } | null;

export function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<FormState>(null);
  const [toArchive, setToArchive] = useState<Account | null>(null);
  const query = useAccounts(showArchived);
  const { create, update, setArchived } = useAccountMutations();
  const toast = useToast();

  const save = async (input: AccountInput) => {
    if (form?.mode === 'edit') {
      await update.mutateAsync({ id: form.account.id, input });
      toast.success('Conta atualizada.');
    } else {
      await create.mutateAsync(input);
      toast.success('Conta criada.');
    }
    setForm(null);
  };

  const changeArchived = async (account: Account, archived: boolean) => {
    try {
      await setArchived.mutateAsync({ id: account.id, archived });
      toast.success(archived ? 'Conta arquivada. O histórico foi preservado.' : 'Conta reativada.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setToArchive(null);
    }
  };

  const accounts = query.data ?? [];

  return (
    <>
      <header className="page-header page-header-row">
        <div>
          <h1>Contas</h1>
          <p className="muted">Onde seu dinheiro está. O saldo atual considera o saldo inicial e as movimentações já liquidadas; o previsto inclui o que está planejado até o fim do mês.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}><Plus size={18} aria-hidden="true" /> Nova conta</button>
      </header>

      <div className="toolbar">
        <label className="check">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Mostrar contas arquivadas
        </label>
      </div>

      {query.isLoading ? (
        <InlineLoading label="Carregando contas…" />
      ) : query.isError ? (
        <InlineError message="Não foi possível carregar as contas." onRetry={() => void query.refetch()} />
      ) : accounts.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Landmark size={22} />} title={showArchived ? 'Nenhuma conta' : 'Você ainda não tem contas'}>
            <p className="muted">Cadastre sua conta corrente, poupança ou carteira para começar a organizar suas finanças.</p>
            <button className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}><Plus size={18} aria-hidden="true" /> Criar primeira conta</button>
          </EmptyState>
        </div>
      ) : (
        <ul className="account-grid">
          {accounts.map((a) => (
            <li key={a.id} className={`card account-card${a.archived ? ' is-archived' : ''}`}>
              <div className="account-top">
                <div>
                  <h2>{a.name}</h2>
                  <p className="muted">{accountTypeLabels[a.type]}{a.institution ? ` · ${a.institution}` : ''}</p>
                </div>
                {a.archived && <span className="chip"><Archive size={13} aria-hidden="true" /> Arquivada</span>}
              </div>
              <div>
                <div className="muted small">Saldo atual</div>
                <div className={`amount${a.currentBalance < 0 ? ' neg' : ''}`}>{formatBRL(a.currentBalance)}</div>
                <div className="muted small">Previsto até o fim do mês: {formatBRL(a.projectedBalance)}</div>
                <div className="muted small">Saldo inicial: {formatBRL(a.openingBalance)} em {formatDate(a.openingDate)}</div>
              </div>
              <div className="card-actions">
                <button className="btn btn-sm" onClick={() => setForm({ mode: 'edit', account: a })}><Pencil size={15} aria-hidden="true" /> Editar</button>
                {a.archived ? (
                  <button className="btn btn-sm" onClick={() => void changeArchived(a, false)}><ArchiveRestore size={15} aria-hidden="true" /> Reativar</button>
                ) : (
                  <button className="btn btn-sm" onClick={() => setToArchive(a)}><Archive size={15} aria-hidden="true" /> Arquivar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={form !== null} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Editar conta' : 'Nova conta'}>
        {form && <AccountForm initial={form.mode === 'edit' ? form.account : undefined} onSubmit={save} onCancel={() => setForm(null)} />}
      </Dialog>

      <ConfirmDialog
        open={toArchive !== null}
        title="Arquivar conta?"
        message={<>A conta <strong>{toArchive?.name}</strong> deixa de aparecer nas listas e nas novas transações, mas todo o histórico é mantido. Você pode reativá-la quando quiser.</>}
        confirmLabel="Arquivar"
        busy={setArchived.isPending}
        onConfirm={() => toArchive && void changeArchived(toArchive, true)}
        onCancel={() => setToArchive(null)}
      />
    </>
  );
}

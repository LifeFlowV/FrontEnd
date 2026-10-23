import { CreditCard as CardIcon, Pencil, Plus, Receipt, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { CardForm, PayInvoiceForm, PurchaseForm } from '../features/cards/CardForms';
import { useCardInvoices, useCardMutations, useCardPurchases, useCards, useInvoice } from '../hooks/useResources';
import { useLookups } from '../hooks/useLookups';
import { useToast } from '../hooks/useToast';
import { invoiceStatusLabels, type CardInput, type CreditCard, type Purchase, type PurchaseInput } from '../types/card';
import { errorMessage } from '../utils/forms';
import { formatBRL, formatDate } from '../utils/format';

type Dlg = { kind: 'card'; card?: CreditCard } | { kind: 'purchase' } | { kind: 'invoice'; id: string } | { kind: 'pay'; id: string } | { kind: 'deletePurchase'; purchase: Purchase } | null;

function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <div className="progress" role="img" aria-label={`${Math.round(pct)}% do limite comprometido`}><div style={{ width: `${pct}%` }} /></div>;
}

export function CardsPage() {
  const cards = useCards();
  const m = useCardMutations();
  const lookups = useLookups();
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const list = cards.data ?? [];
  const activeId = selected ?? list[0]?.id ?? null;
  const card = list.find((c) => c.id === activeId) ?? null;
  const invoices = useCardInvoices(activeId);
  const purchases = useCardPurchases(activeId);
  const detail = useInvoice(dlg && (dlg.kind === 'invoice' || dlg.kind === 'pay') ? dlg.id : null);

  const saveCard = async (input: CardInput) => {
    if (dlg?.kind === 'card' && dlg.card) { await m.update.mutateAsync({ id: dlg.card.id, input }); toast.success('Cartão atualizado.'); }
    else { await m.create.mutateAsync(input); toast.success('Cartão criado.'); }
    setDlg(null);
  };
  const savePurchase = async (input: PurchaseInput) => { await m.createPurchase.mutateAsync(input); toast.success('Compra registrada e parcelas distribuídas nas faturas.'); setSelected(input.cardId); setDlg(null); };
  const removePurchase = async (p: Purchase) => {
    try { await m.deletePurchase.mutateAsync(p.id); toast.success('Compra excluída.'); } catch (e) { toast.error(errorMessage(e)); } finally { setDlg(null); }
  };

  return (
    <>
      <header className="page-header page-header-row">
        <div>
          <h1>Cartões</h1>
          <p className="muted">Compras parceladas viram parcelas nas faturas. A compra não mexe no saldo: só o pagamento da fatura sai da conta.</p>
        </div>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => setDlg({ kind: 'card' })}><Plus size={18} aria-hidden="true" /> Novo cartão</button>
          {list.length > 0 && <button className="btn" onClick={() => setDlg({ kind: 'purchase' })}><ShoppingBag size={16} aria-hidden="true" /> Nova compra</button>}
        </div>
      </header>

      {cards.isLoading ? <InlineLoading label="Carregando cartões…" /> : cards.isError ? <InlineError message="Não foi possível carregar os cartões." onRetry={() => void cards.refetch()} /> : list.length === 0 ? (
        <div className="card"><EmptyState icon={<CardIcon size={22} />} title="Nenhum cartão cadastrado">
          <p className="muted">Cadastre um cartão com limite, fechamento e vencimento para registrar compras parceladas.</p>
          <button className="btn btn-primary" onClick={() => setDlg({ kind: 'card' })}><Plus size={18} aria-hidden="true" /> Criar primeiro cartão</button>
        </EmptyState></div>
      ) : (
        <>
          <ul className="account-grid">
            {list.map((c) => (
              <li key={c.id} className={`card account-card${c.id === activeId ? ' is-selected' : ''}`}>
                <div className="account-top"><div><h2>{c.name}</h2><p className="muted">{[c.institution, c.brand].filter(Boolean).join(' · ') || 'Cartão de crédito'} · fecha dia {c.closingDay}, vence dia {c.dueDay}</p></div></div>
                <div>
                  <div className="muted small">Limite disponível</div>
                  <div className={`amount${c.availableLimit < 0 ? ' neg' : ''}`}>{formatBRL(c.availableLimit)}</div>
                  <Progress value={c.committedLimit} max={c.creditLimit} />
                  <div className="muted small">{formatBRL(c.committedLimit)} comprometidos de {formatBRL(c.creditLimit)}</div>
                  {c.availableLimit < 0 && <div className="small neg">Limite excedido em {formatBRL(-c.availableLimit)}.</div>}
                </div>
                {c.currentInvoice && <div className="small">Fatura atual: <strong>{formatBRL(c.currentInvoice.total)}</strong> · vence {formatDate(c.currentInvoice.dueDate)}</div>}
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => setSelected(c.id)} aria-pressed={c.id === activeId}><Receipt size={15} aria-hidden="true" /> Faturas e compras</button>
                  <button className="btn btn-sm" onClick={() => setDlg({ kind: 'card', card: c })}><Pencil size={15} aria-hidden="true" /> Editar</button>
                </div>
              </li>
            ))}
          </ul>

          {card && (
            <div className="two-col">
              <section className="card" aria-labelledby="inv-title">
                <h2 id="inv-title">Faturas de {card.name}</h2>
                {invoices.isLoading ? <InlineLoading label="Carregando faturas…" /> : (invoices.data ?? []).length === 0 ? <p className="muted">Nenhuma fatura ainda. Registre uma compra.</p> : (
                  <ul className="list">
                    {(invoices.data ?? []).slice().reverse().map((i) => (
                      <li key={i.id} className="list-row">
                        <span className="list-main"><strong>Vence {formatDate(i.dueDate)}</strong><br /><span className="muted small">Fecha {formatDate(i.closingDate)}</span></span>
                        <span className={`chip ${i.status === 'OVERDUE' ? 'chip-expense' : i.status === 'PAID' ? 'chip-income' : ''}`}>{invoiceStatusLabels[i.status]}</span>
                        <span className="num-inline">{formatBRL(i.total)}</span>
                        <button className="btn btn-sm" onClick={() => setDlg({ kind: 'invoice', id: i.id })}>Abrir</button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card" aria-labelledby="pur-title">
                <h2 id="pur-title">Compras de {card.name}</h2>
                {purchases.isLoading ? <InlineLoading label="Carregando compras…" /> : (purchases.data ?? []).length === 0 ? <p className="muted">Nenhuma compra registrada.</p> : (
                  <ul className="list">
                    {(purchases.data ?? []).map((p) => (
                      <li key={p.id} className="list-row">
                        <span className="list-main"><strong>{p.description}</strong><br /><span className="muted small">{formatDate(p.purchaseDate)} · {p.installmentsCount}x · {p.paidCount} paga(s), {p.remainingCount} restante(s)</span></span>
                        <span className="num-inline">{formatBRL(p.totalAmount)}</span>
                        <button className="icon-btn" aria-label={`Excluir compra ${p.description}`} title="Excluir" onClick={() => setDlg({ kind: 'deletePurchase', purchase: p })}><Trash2 size={16} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}

      <Dialog open={dlg?.kind === 'card'} onClose={() => setDlg(null)} title={dlg?.kind === 'card' && dlg.card ? 'Editar cartão' : 'Novo cartão'}>
        {dlg?.kind === 'card' && <CardForm initial={dlg.card} onSubmit={saveCard} onCancel={() => setDlg(null)} />}
      </Dialog>
      <Dialog open={dlg?.kind === 'purchase'} onClose={() => setDlg(null)} title="Nova compra no cartão">
        {dlg?.kind === 'purchase' && <PurchaseForm cards={list} defaultCardId={activeId ?? undefined} onSubmit={savePurchase} onCancel={() => setDlg(null)} />}
      </Dialog>
      <Dialog open={dlg?.kind === 'invoice'} onClose={() => setDlg(null)} title="Fatura">
        {detail.data && dlg?.kind === 'invoice' && (
          <div>
            <p className="muted">{detail.data.summary.cardName} · vence {formatDate(detail.data.summary.dueDate)} · {invoiceStatusLabels[detail.data.summary.status]}</p>
            <p><strong>{formatBRL(detail.data.summary.total)}</strong> no total · pago {formatBRL(detail.data.summary.paid)} · falta {formatBRL(detail.data.summary.remaining)}</p>
            <ul className="list">{detail.data.lines.map((l) => (
              <li key={l.installmentId} className="list-row"><span className="list-main">{l.description} <span className="muted small">({l.number}/{l.count})</span></span><span className="num-inline">{formatBRL(l.amount)}</span></li>
            ))}</ul>
            {detail.data.payments.length > 0 && <><h3 className="h3">Pagamentos</h3><ul className="list">{detail.data.payments.map((p) => <li key={p.id} className="list-row"><span className="list-main">{formatDate(p.paidDate)}</span><span className="num-inline">{formatBRL(p.amount)}</span></li>)}</ul></>}
            <div className="dialog-actions">
              <button className="btn" onClick={() => setDlg(null)}>Fechar</button>
              {detail.data.summary.remaining > 0 && <button className="btn btn-primary" onClick={() => setDlg({ kind: 'pay', id: detail.data!.summary.id })}>Pagar fatura</button>}
            </div>
          </div>
        )}
      </Dialog>
      <Dialog open={dlg?.kind === 'pay'} onClose={() => setDlg(null)} title="Pagar fatura">
        {detail.data && dlg?.kind === 'pay' && (
          <PayInvoiceForm detail={detail.data} defaultAccountId={card?.paymentAccountId ?? lookups.accounts[0]?.id ?? ''}
            onCancel={() => setDlg(null)} onSubmit={async (input) => { await m.pay.mutateAsync({ id: dlg.id, input }); toast.success('Pagamento registrado.'); setDlg(null); }} />
        )}
      </Dialog>
      <ConfirmDialog open={dlg?.kind === 'deletePurchase'} title="Excluir compra?" destructive confirmLabel="Excluir" busy={m.deletePurchase.isPending}
        message={<>A compra <strong>{dlg?.kind === 'deletePurchase' ? dlg.purchase.description : ''}</strong> e todas as suas parcelas serão removidas das faturas. Só é possível se nenhuma fatura envolvida recebeu pagamento.</>}
        onCancel={() => setDlg(null)} onConfirm={() => dlg?.kind === 'deletePurchase' && void removePurchase(dlg.purchase)} />
    </>
  );
}

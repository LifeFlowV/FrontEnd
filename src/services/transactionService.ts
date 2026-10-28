import type {
  Page, PaymentMethod, PaymentMethodInput, Transaction, TransactionFilters, TransactionInput, TransactionSummary, TransferInput,
} from '../types/transaction';
import { api } from './api';

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface ListParams extends TransactionFilters { page: number; size: number; sort: string; dir: 'asc' | 'desc' }

async function listAll(filters: TransactionFilters, sort: string, dir: 'asc' | 'desc') {
  const size = 100;
  const first = await api<Page<Transaction>>(`/transactions${query({ ...filters, page: 0, size, sort, dir })}`);
  const transactions = [...first.content];

  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await api<Page<Transaction>>(`/transactions${query({ ...filters, page, size, sort, dir })}`);
    transactions.push(...next.content);
  }

  return transactions;
}

export const transactionService = {
  list: (p: ListParams) => api<Page<Transaction>>(`/transactions${query({ ...p })}`),
  listAll,
  summary: (f: TransactionFilters) => api<TransactionSummary>(`/transactions/summary${query({ ...f })}`),
  create: (input: TransactionInput) => api<Transaction>('/transactions', { method: 'POST', body: input }),
  update: (id: string, input: TransactionInput) => api<Transaction>(`/transactions/${id}`, { method: 'PUT', body: input }),
  settle: (id: string, date: string | null) => api<Transaction>(`/transactions/${id}/settle`, { method: 'POST', body: { date } }),
  cancel: (id: string) => api<Transaction>(`/transactions/${id}/cancel`, { method: 'POST' }),
  reverse: (id: string, date: string | null) => api<Transaction>(`/transactions/${id}/reverse`, { method: 'POST', body: { date } }),
  remove: (id: string) => api<void>(`/transactions/${id}`, { method: 'DELETE' }),
  transfer: (input: TransferInput) => api<unknown>('/transfers', { method: 'POST', body: input }),
};

export const paymentMethodService = {
  list: (includeInactive: boolean) => api<PaymentMethod[]>(`/payment-methods?includeInactive=${includeInactive}`),
  create: (input: PaymentMethodInput) => api<PaymentMethod>('/payment-methods', { method: 'POST', body: input }),
  update: (id: string, input: PaymentMethodInput) => api<PaymentMethod>(`/payment-methods/${id}`, { method: 'PUT', body: input }),
  setActive: (id: string, active: boolean) => api<PaymentMethod>(`/payment-methods/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST' }),
};

import type { CardInput, CreditCard, InvoiceDetail, InvoiceSummary, PayInvoiceInput, Purchase, PurchaseInput } from '../types/card';
import type { Debt, DebtInput, DebtSummary, InstallmentView, PayInstallmentInput } from '../types/debt';
import { api } from './api';

export const cardService = {
  list: (includeInactive: boolean) => api<CreditCard[]>(`/credit-cards?includeInactive=${includeInactive}`),
  create: (input: CardInput) => api<CreditCard>('/credit-cards', { method: 'POST', body: input }),
  update: (id: string, input: CardInput) => api<CreditCard>(`/credit-cards/${id}`, { method: 'PUT', body: input }),
  setActive: (id: string, active: boolean) => api<CreditCard>(`/credit-cards/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST' }),
  purchases: (cardId: string) => api<Purchase[]>(`/credit-cards/${cardId}/purchases`),
  createPurchase: (input: PurchaseInput) => api<Purchase>('/purchases', { method: 'POST', body: input }),
  deletePurchase: (id: string) => api<void>(`/purchases/${id}`, { method: 'DELETE' }),
  invoices: (cardId: string) => api<InvoiceSummary[]>(`/invoices?cardId=${cardId}`),
  invoice: (id: string) => api<InvoiceDetail>(`/invoices/${id}`),
  pay: (id: string, input: PayInvoiceInput) => api<InvoiceDetail>(`/invoices/${id}/payments`, { method: 'POST', body: input }),
};

export const debtService = {
  list: () => api<Debt[]>('/debts'),
  get: (id: string) => api<Debt>(`/debts/${id}`),
  summary: (months = 12) => api<DebtSummary>(`/debts/summary?months=${months}`),
  between: (from: string, to: string) => api<InstallmentView[]>(`/debts/installments?from=${from}&to=${to}`),
  create: (input: DebtInput) => api<Debt>('/debts', { method: 'POST', body: input }),
  remove: (id: string) => api<void>(`/debts/${id}`, { method: 'DELETE' }),
  pay: (installmentId: string, input: PayInstallmentInput) => api<Debt>(`/debts/installments/${installmentId}/payments`, { method: 'POST', body: input }),
};

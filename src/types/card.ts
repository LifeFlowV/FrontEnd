export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';
export const invoiceStatusLabels: Record<InvoiceStatus, string> = { OPEN: 'Aberta', CLOSED: 'Fechada', PAID: 'Paga', OVERDUE: 'Vencida' };

export interface InvoiceSummary { id: string; cardId: string; cardName: string; closingDate: string; dueDate: string; total: number; paid: number; remaining: number; status: InvoiceStatus }

export interface CreditCard {
  id: string; name: string; institution: string | null; brand: string | null; creditLimit: number; closingDay: number; dueDay: number;
  paymentAccountId: string; active: boolean; notes: string | null; committedLimit: number; availableLimit: number;
  currentInvoice: InvoiceSummary | null; openInvoicesTotal: number;
}
export interface CardInput { name: string; institution: string | null; brand: string | null; creditLimit: number; closingDay: number; dueDay: number; paymentAccountId: string; notes: string | null }

export interface InvoiceLine { installmentId: string; purchaseId: string; description: string; number: number; count: number; amount: number; purchaseDate: string; paid: boolean }
export interface InvoicePaymentLine { id: string; accountId: string; amount: number; paidDate: string }
export interface InvoiceDetail { summary: InvoiceSummary; lines: InvoiceLine[]; payments: InvoicePaymentLine[] }
export interface PayInvoiceInput { accountId: string | null; amount: number; paidDate: string | null }

export interface InstallmentLine { number: number; amount: number; invoiceId: string; closingDate: string; dueDate: string; paidDate: string | null }
export interface Purchase {
  id: string; cardId: string; description: string; totalAmount: number; installmentsCount: number; purchaseDate: string;
  categoryId: string | null; notes: string | null; installments: InstallmentLine[]; paidTotal: number; remainingTotal: number; paidCount: number; remainingCount: number;
}
export interface PurchaseInput { cardId: string; description: string; totalAmount: number; installments: number; purchaseDate: string; categoryId: string | null; notes: string | null }

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
export type TransactionStatus = 'PLANNED' | 'SETTLED' | 'CANCELED';
export type PaymentMethodKind = 'CASH' | 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'BOLETO' | 'BANK_TRANSFER' | 'AUTO_DEBIT' | 'DIGITAL_WALLET' | 'OTHER';

export const paymentKindLabels: Record<PaymentMethodKind, string> = {
  CASH: 'Dinheiro', PIX: 'PIX', DEBIT_CARD: 'Cartão de débito', CREDIT_CARD: 'Cartão de crédito', BOLETO: 'Boleto',
  BANK_TRANSFER: 'Transferência bancária', AUTO_DEBIT: 'Débito automático', DIGITAL_WALLET: 'Carteira digital', OTHER: 'Outro',
};

export interface PaymentMethod { id: string; name: string; kind: PaymentMethodKind; active: boolean }
export interface PaymentMethodInput { name: string; kind: PaymentMethodKind }

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  competenceDate: string;
  dueDate: string | null;
  settledDate: string | null;
  status: TransactionStatus;
  accountId: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  notes: string | null;
  transferGroupId: string | null;
  reversalOfId: string | null;
  reversed: boolean;
  sourceType: 'DEBT_PAYMENT' | 'INVOICE_PAYMENT' | 'RECURRING' | null;
  tagIds: string[];
  editable: boolean;
  overdue: boolean;
}

export interface TransactionInput {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  competenceDate: string;
  dueDate: string | null;
  accountId: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  settled: boolean;
  settledDate: string | null;
  notes: string | null;
  tagIds: string[];
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string | null;
  description: string | null;
  notes: string | null;
}

export interface TransactionFilters {
  from?: string; to?: string; categoryId?: string; accountId?: string; paymentMethodId?: string;
  status?: TransactionStatus; type?: TransactionType; tagId?: string; q?: string;
}

export interface TransactionSummary { income: number; expense: number; result: number; plannedIncome: number; plannedExpense: number; count: number }

export interface Page<T> { content: T[]; totalElements: number; totalPages: number; page: number; size: number }

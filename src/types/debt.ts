export type InstallmentStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type DebtStatus = 'ACTIVE' | 'OVERDUE' | 'PAID';
export const installmentStatusLabels: Record<InstallmentStatus, string> = { OPEN: 'Em aberto', PARTIAL: 'Parcial', PAID: 'Paga', OVERDUE: 'Atrasada' };
export const debtStatusLabels: Record<DebtStatus, string> = { ACTIVE: 'Ativa', OVERDUE: 'Em atraso', PAID: 'Quitada' };

export interface DebtInstallment {
  id: string; number: number; principal: number; interest: number; adjustment: number; totalDue: number; paid: number; remaining: number;
  dueDate: string; status: InstallmentStatus; lastPaymentDate: string | null; suggestedPenalty: number;
}
export interface Debt {
  id: string; name: string; creditor: string; categoryId: string | null; description: string | null; originalAmount: number;
  contractDate: string; firstDueDate: string; installmentsCount: number; interestRate: number | null; penaltyRate: number | null;
  paymentMethodId: string | null; notes: string | null; totalDue: number; totalPaid: number; remaining: number; paidInstallments: number;
  remainingInstallments: number; status: DebtStatus; nextDueDate: string | null; installments: DebtInstallment[];
}
export interface DebtInput {
  name: string; creditor: string; categoryId: string | null; description: string | null; originalAmount: number; contractDate: string;
  firstDueDate: string; installments: number; interestRate: number | null; penaltyRate: number | null; paymentMethodId: string | null; notes: string | null;
}
export interface PayInstallmentInput { accountId: string; amount: number; paidDate: string | null; lateFee: number | null; discount: number | null; notes: string | null }
export interface InstallmentView { id: string; debtId: string; debtName: string; creditor: string; number: number; count: number; dueDate: string; totalDue: number; paid: number; remaining: number; status: InstallmentStatus }
export interface MonthForecast { month: string; planned: number; paid: number }
export interface DebtSummary {
  totalOriginal: number; totalDue: number; totalPaid: number; totalRemaining: number; activeDebts: number; remainingInstallments: number;
  overdueInstallments: number; overdueAmount: number; upcoming: InstallmentView[]; forecast: MonthForecast[];
}

export interface MonthlyPoint { month: string; income: number; expense: number; result: number }
export interface CategoryTotal { categoryId: string | null; name: string; parentId: string | null; parentName: string | null; amount: number }
export interface NamedTotal { name: string; amount: number }
export interface MonthValue { month: string; value: number }
export interface FinancialReport { from: string; to: string; totalIncome: number; totalExpense: number; monthly: MonthlyPoint[]; byCategory: CategoryTotal[]; byPaymentMethod: NamedTotal[]; byCard: NamedTotal[] }
export interface ObligationMonth { month: string; debts: number; cards: number; recurring: number; other: number; total: number }
export interface ObligationsReport { future: ObligationMonth[]; paidByMonth: MonthValue[]; debtsRemaining: number; debtsRemainingHistory: MonthValue[] }
export interface ProductivityReport { from: string; to: string; tasksDone: number; tasksPending: number; tasksOverdue: number; tasksCanceled: number; completionRate: number; plannedHours: number; eventsDone: number; eventsNotDone: number; eventsScheduled: number; eventsCanceled: number }
export interface Commitment { type: string; title: string; date: string; amount: number | null; direction: 'IN' | 'OUT' | null; overdue: boolean }
export interface UpcomingEvent { title: string; date: string; startTime: string | null; endTime: string | null; allDay: boolean; conflict: boolean }
export interface Dashboard {
  month: string; consolidatedBalance: number; monthIncome: number; monthExpense: number; monthResult: number; billsToPay: number; billsToPayCount: number;
  overdueAmount: number; overdueCount: number; openInvoices: number; debtsRemaining: number; forecastThisMonth: number; forecastNextMonths: MonthValue[];
  tasksToday: number; tasksDoneToday: number; tasksPending: number; tasksOverdue: number; upcomingEvents: UpcomingEvent[]; upcomingCommitments: Commitment[];
  incomeVsExpense: MonthlyPoint[]; expenseByCategory: CategoryTotal[]; balanceEvolution: MonthValue[]; debtEvolution: MonthValue[]; byPaymentMethod: NamedTotal[];
}
export interface ReportFilters { from: string; to: string; categoryId?: string; accountId?: string; paymentMethodId?: string }

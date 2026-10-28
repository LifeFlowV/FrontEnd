export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  month: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'OK' | 'WARNING' | 'EXCEEDED';
}

export interface BudgetInput {
  categoryId: string;
  month: string;
  limitAmount: number;
}

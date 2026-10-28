import { api } from './api';
import type { Budget, BudgetInput } from '../types/budget';

export const budgetService = {
  list: (month: string) => api<Budget[]>(`/budgets?month=${encodeURIComponent(month)}`),
  save: (input: BudgetInput) => api<Budget>('/budgets', { method: 'PUT', body: input }),
  remove: (id: string) => api<void>(`/budgets/${id}`, { method: 'DELETE' }),
};

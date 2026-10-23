import type { Dashboard, FinancialReport, MonthValue, ObligationsReport, ProductivityReport, ReportFilters } from '../types/report';
import { api } from './api';

const qs = (p: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  return `?${q.toString()}`;
};

export const reportService = {
  dashboard: (month: string) => api<Dashboard>(`/dashboard${qs({ month })}`),
  financial: (f: ReportFilters) => api<FinancialReport>(`/reports/financial${qs({ ...f })}`),
  balanceHistory: (months = 12) => api<MonthValue[]>(`/reports/balance-history${qs({ months })}`),
  obligations: (months = 12) => api<ObligationsReport>(`/reports/obligations${qs({ months })}`),
  productivity: (from: string, to: string) => api<ProductivityReport>(`/reports/productivity${qs({ from, to })}`),
};

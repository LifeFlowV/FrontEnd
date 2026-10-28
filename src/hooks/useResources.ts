import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import { categoryService, tagService } from '../services/categoryService';
import type { AccountInput } from '../types/account';
import type { CategoryInput, TagInput } from '../types/category';
import { reportService } from '../services/reportService';
import type { ReportFilters } from '../types/report';
import { calendarService, eventService, recurringService, taskService, type TaskFilters } from '../services/agendaService';
import type { EventInput, EventStatus, RecurringInput, Scope, TaskInput, TaskStatus } from '../types/agenda';
import { cardService, debtService } from '../services/cardService';
import type { CardInput, PayInvoiceInput, PurchaseInput } from '../types/card';
import type { DebtInput, PayInstallmentInput } from '../types/debt';
import { paymentMethodService, transactionService, type ListParams } from '../services/transactionService';
import type { PaymentMethodInput, TransactionFilters, TransactionInput, TransferInput } from '../types/transaction';
import { budgetService } from '../services/budgetService';
import type { BudgetInput } from '../types/budget';


export const useAccounts = (includeArchived: boolean) =>
  useQuery({ queryKey: ['accounts', { includeArchived }], queryFn: () => accountService.list(includeArchived) });

export const useBudgets = (month: string) =>
  useQuery({ queryKey: ['budgets', month], queryFn: () => budgetService.list(month) });

export function useBudgetMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
  return {
    save: useMutation({ mutationFn: (input: BudgetInput) => budgetService.save(input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => budgetService.remove(id), onSuccess: invalidate }),
  };
}

export function useAccountMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['accounts'] });
  return {
    create: useMutation({ mutationFn: (input: AccountInput) => accountService.create(input), onSuccess }),
    update: useMutation({ mutationFn: (v: { id: string; input: AccountInput }) => accountService.update(v.id, v.input), onSuccess }),
    setArchived: useMutation({ mutationFn: (v: { id: string; archived: boolean }) => accountService.setArchived(v.id, v.archived), onSuccess }),
  };
}

export const useCategoryTree = (includeInactive: boolean) =>
  useQuery({ queryKey: ['categories', { includeInactive }], queryFn: () => categoryService.tree(includeInactive) });

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['categories'] });
  return {
    create: useMutation({ mutationFn: (input: CategoryInput) => categoryService.create(input), onSuccess }),
    update: useMutation({ mutationFn: (v: { id: string; input: CategoryInput }) => categoryService.update(v.id, v.input), onSuccess }),
    setActive: useMutation({ mutationFn: (v: { id: string; active: boolean }) => categoryService.setActive(v.id, v.active), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => categoryService.remove(id), onSuccess }),
    restoreDefaults: useMutation({ mutationFn: () => categoryService.restoreDefaults(), onSuccess }),
  };
}

export const useTags = () => useQuery({ queryKey: ['tags'], queryFn: () => tagService.list() });

export function useTagMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['tags'] });
  return {
    create: useMutation({ mutationFn: (input: TagInput) => tagService.create(input), onSuccess }),
    update: useMutation({ mutationFn: (v: { id: string; input: TagInput }) => tagService.update(v.id, v.input), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => tagService.remove(id), onSuccess }),
  };
}

// ---------- Fase 3: transações e formas de pagamento ----------

export const useTransactions = (params: ListParams) =>
  useQuery({ queryKey: ['transactions', 'list', params], queryFn: () => transactionService.list(params), placeholderData: keepPreviousData });

export const useTransactionSummary = (filters: TransactionFilters) =>
  useQuery({ queryKey: ['transactions', 'summary', filters], queryFn: () => transactionService.summary(filters) });

/** Qualquer alteração financeira invalida saldos, listas, faturas, dívidas, calendário e dashboard. */
function useInvalidateFinance() {
  const queryClient = useQueryClient();
  return () => Promise.all(['transactions', 'accounts', 'dashboard', 'reports', 'calendar', 'invoices', 'cards', 'debts'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
}

export function useTransactionMutations() {
  const onSuccess = useInvalidateFinance();
  return {
    create: useMutation({ mutationFn: (input: TransactionInput) => transactionService.create(input), onSuccess }),
    update: useMutation({ mutationFn: (v: { id: string; input: TransactionInput }) => transactionService.update(v.id, v.input), onSuccess }),
    settle: useMutation({ mutationFn: (v: { id: string; date: string | null }) => transactionService.settle(v.id, v.date), onSuccess }),
    cancel: useMutation({ mutationFn: (id: string) => transactionService.cancel(id), onSuccess }),
    reverse: useMutation({ mutationFn: (v: { id: string; date: string | null }) => transactionService.reverse(v.id, v.date), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => transactionService.remove(id), onSuccess }),
    transfer: useMutation({ mutationFn: (input: TransferInput) => transactionService.transfer(input), onSuccess }),
  };
}

export const usePaymentMethods = (includeInactive = false) =>
  useQuery({ queryKey: ['payment-methods', { includeInactive }], queryFn: () => paymentMethodService.list(includeInactive) });

export function usePaymentMethodMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
  return {
    create: useMutation({ mutationFn: (input: PaymentMethodInput) => paymentMethodService.create(input), onSuccess }),
    update: useMutation({ mutationFn: (v: { id: string; input: PaymentMethodInput }) => paymentMethodService.update(v.id, v.input), onSuccess }),
    setActive: useMutation({ mutationFn: (v: { id: string; active: boolean }) => paymentMethodService.setActive(v.id, v.active), onSuccess }),
  };
}

// ---------- Fase 4: cartões e dívidas ----------

export const useCards = () => useQuery({ queryKey: ['cards', 'list'], queryFn: () => cardService.list(false) });
export const useCardPurchases = (cardId: string | null) =>
  useQuery({ queryKey: ['cards', 'purchases', cardId], queryFn: () => cardService.purchases(cardId!), enabled: !!cardId });
export const useCardInvoices = (cardId: string | null) =>
  useQuery({ queryKey: ['invoices', 'list', cardId], queryFn: () => cardService.invoices(cardId!), enabled: !!cardId });
export const useInvoice = (id: string | null) => useQuery({ queryKey: ['invoices', 'detail', id], queryFn: () => cardService.invoice(id!), enabled: !!id });

export function useCardMutations() {
  const invalidate = useInvalidateFinance();
  return {
    create: useMutation({ mutationFn: (input: CardInput) => cardService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (v: { id: string; input: CardInput }) => cardService.update(v.id, v.input), onSuccess: invalidate }),
    setActive: useMutation({ mutationFn: (v: { id: string; active: boolean }) => cardService.setActive(v.id, v.active), onSuccess: invalidate }),
    createPurchase: useMutation({ mutationFn: (input: PurchaseInput) => cardService.createPurchase(input), onSuccess: invalidate }),
    deletePurchase: useMutation({ mutationFn: (id: string) => cardService.deletePurchase(id), onSuccess: invalidate }),
    pay: useMutation({ mutationFn: (v: { id: string; input: PayInvoiceInput }) => cardService.pay(v.id, v.input), onSuccess: invalidate }),
  };
}

export const useDebts = () => useQuery({ queryKey: ['debts', 'list'], queryFn: () => debtService.list() });
export const useDebtSummary = (months = 12) => useQuery({ queryKey: ['debts', 'summary', months], queryFn: () => debtService.summary(months) });

export function useDebtMutations() {
  const invalidate = useInvalidateFinance();
  return {
    create: useMutation({ mutationFn: (input: DebtInput) => debtService.create(input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => debtService.remove(id), onSuccess: invalidate }),
    pay: useMutation({ mutationFn: (v: { installmentId: string; input: PayInstallmentInput }) => debtService.pay(v.installmentId, v.input), onSuccess: invalidate }),
  };
}

// ---------- Fase 5/6: tarefas, eventos, calendário e obrigações recorrentes ----------

export const useTasks = (filters: TaskFilters) => useQuery({ queryKey: ['tasks', 'list', filters], queryFn: () => taskService.list(filters) });
export const useTaskHistory = (from: string, to: string) => useQuery({ queryKey: ['tasks', 'history', from, to], queryFn: () => taskService.history(from, to) });
export const useEvents = () => useQuery({ queryKey: ['events', 'list'], queryFn: () => eventService.list() });
export const useCalendarItems = (from: string | null, to: string | null, types: string, categoryId: string, status: string) =>
  useQuery({
    queryKey: ['calendar', from, to, types, categoryId, status],
    queryFn: () => calendarService.items(from!, to!, types || undefined, categoryId || undefined, status || undefined),
    enabled: !!from && !!to,
    placeholderData: keepPreviousData,
  });
export const useRecurringBills = () => useQuery({ queryKey: ['recurring', 'list'], queryFn: () => recurringService.list() });

/** Tarefas, eventos e itens financeiros aparecem juntos: qualquer alteração invalida todas as visões. */
function useInvalidateAgenda() {
  const queryClient = useQueryClient();
  return () => Promise.all(['tasks', 'events', 'calendar', 'dashboard', 'reports', 'recurring', 'transactions', 'accounts'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
}

export function useAgendaMutations() {
  const onSuccess = useInvalidateAgenda();
  return {
    createTask: useMutation({ mutationFn: (input: TaskInput) => taskService.create(input), onSuccess }),
    updateTask: useMutation({ mutationFn: (v: { id: string; input: TaskInput; scope?: Scope; occurrence?: string | null }) => taskService.update(v.id, v.input, v.scope, v.occurrence), onSuccess }),
    scheduleTask: useMutation({ mutationFn: (v: { id: string; body: { date: string | null; startTime: string | null; endTime: string | null }; scope?: Scope; occurrence?: string | null }) => taskService.schedule(v.id, v.body, v.scope, v.occurrence), onSuccess }),
    taskStatus: useMutation({ mutationFn: (v: { id: string; status: TaskStatus; occurrence?: string | null }) => taskService.status(v.id, v.status, v.occurrence), onSuccess }),
    duplicateTask: useMutation({ mutationFn: (id: string) => taskService.duplicate(id), onSuccess }),
    removeTask: useMutation({ mutationFn: (v: { id: string; scope?: Scope; occurrence?: string | null }) => taskService.remove(v.id, v.scope, v.occurrence), onSuccess }),
    createEvent: useMutation({ mutationFn: (input: EventInput) => eventService.create(input), onSuccess }),
    updateEvent: useMutation({ mutationFn: (v: { id: string; input: EventInput; scope?: Scope; occurrence?: string | null }) => eventService.update(v.id, v.input, v.scope, v.occurrence), onSuccess }),
    scheduleEvent: useMutation({ mutationFn: (v: { id: string; body: { date: string | null; startTime: string | null; endTime: string | null; allDay: boolean | null }; scope?: Scope; occurrence?: string | null }) => eventService.schedule(v.id, v.body, v.scope, v.occurrence), onSuccess }),
    eventStatus: useMutation({ mutationFn: (v: { id: string; status: EventStatus; occurrence?: string | null }) => eventService.status(v.id, v.status, v.occurrence), onSuccess }),
    duplicateEvent: useMutation({ mutationFn: (id: string) => eventService.duplicate(id), onSuccess }),
    removeEvent: useMutation({ mutationFn: (v: { id: string; scope?: Scope; occurrence?: string | null }) => eventService.remove(v.id, v.scope, v.occurrence), onSuccess }),
    createRecurring: useMutation({ mutationFn: (input: RecurringInput) => recurringService.create(input), onSuccess }),
    updateRecurring: useMutation({ mutationFn: (v: { id: string; input: RecurringInput }) => recurringService.update(v.id, v.input), onSuccess }),
    setRecurringActive: useMutation({ mutationFn: (v: { id: string; active: boolean }) => recurringService.setActive(v.id, v.active), onSuccess }),
    settleRecurring: useMutation({ mutationFn: (v: { id: string; occurrence: string; settledDate: string | null }) => recurringService.settle(v.id, v.occurrence, v.settledDate), onSuccess }),
    removeRecurring: useMutation({ mutationFn: (id: string) => recurringService.remove(id), onSuccess }),
  };
}

// ---------- Fase 7: dashboard e relatórios ----------

export const useDashboard = (month: string) => useQuery({ queryKey: ['dashboard', month], queryFn: () => reportService.dashboard(month), placeholderData: keepPreviousData });
export const useFinancialReport = (f: ReportFilters) => useQuery({ queryKey: ['reports', 'financial', f], queryFn: () => reportService.financial(f), placeholderData: keepPreviousData });
export const useBalanceHistory = (months = 12) => useQuery({ queryKey: ['reports', 'balance', months], queryFn: () => reportService.balanceHistory(months) });
export const useObligations = (months = 12) => useQuery({ queryKey: ['reports', 'obligations', months], queryFn: () => reportService.obligations(months) });
export const useProductivity = (from: string, to: string) => useQuery({ queryKey: ['reports', 'productivity', from, to], queryFn: () => reportService.productivity(from, to), placeholderData: keepPreviousData });

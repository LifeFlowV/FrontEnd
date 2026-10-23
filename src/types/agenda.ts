export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type MonthMode = 'DAY_OF_MONTH' | 'LAST_DAY' | 'LAST_BUSINESS_DAY';
export type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type Scope = 'THIS' | 'THIS_AND_FOLLOWING' | 'ALL';

export const weekdayOrder: Weekday[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
export const weekdayShort: Record<Weekday, string> = { MONDAY: 'seg', TUESDAY: 'ter', WEDNESDAY: 'qua', THURSDAY: 'qui', FRIDAY: 'sex', SATURDAY: 'sáb', SUNDAY: 'dom' };

export interface RecurrenceInput { frequency: Frequency; interval: number; weekdays: Weekday[]; monthMode: MonthMode | null; monthDay: number | null; until: string | null }
export interface Recurrence extends RecurrenceInput { start: string }

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
export const priorityLabels: Record<TaskPriority, string> = { LOW: 'Baixa', NORMAL: 'Normal', HIGH: 'Alta', URGENT: 'Urgente' };
export const taskStatusLabels: Record<TaskStatus, string> = { PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', DONE: 'Concluída', CANCELED: 'Cancelada' };

export interface Task {
  id: string; parentTaskId: string | null; title: string; description: string | null; date: string | null; startTime: string | null; endTime: string | null;
  priority: TaskPriority; status: TaskStatus; categoryId: string | null; notes: string | null; completedAt: string | null; tagIds: string[];
  recurrence: Recurrence | null; overdue: boolean; nextOccurrence: string | null; subtasks: Task[]; subtaskTotal: number; subtaskDone: number;
}
export interface TaskInput {
  title: string; description: string | null; date: string | null; startTime: string | null; endTime: string | null; priority: TaskPriority; status?: TaskStatus | null;
  categoryId: string | null; notes: string | null; tagIds: string[]; parentTaskId?: string | null; recurrence?: RecurrenceInput | null;
}
export interface HistoryEntry { taskId: string; title: string; completedAt: string; occurrenceDate: string | null }

export type EventStatus = 'SCHEDULED' | 'DONE' | 'NOT_DONE' | 'CANCELED';
export const eventStatusLabels: Record<EventStatus, string> = { SCHEDULED: 'Agendado', DONE: 'Realizado', NOT_DONE: 'Não realizado', CANCELED: 'Cancelado' };
export interface AgendaEvent {
  id: string; title: string; description: string | null; date: string; startTime: string | null; endTime: string | null; allDay: boolean; location: string | null;
  categoryId: string | null; status: EventStatus; notes: string | null; tagIds: string[]; recurrence: Recurrence | null; hasConflict: boolean;
}
export interface EventInput {
  title: string; description: string | null; date: string; startTime: string | null; endTime: string | null; allDay: boolean; location: string | null;
  categoryId: string | null; notes: string | null; tagIds: string[]; recurrence?: RecurrenceInput | null;
}

export type CalendarItemType = 'TASK' | 'EVENT' | 'BILL' | 'RECURRING_BILL' | 'DEBT_INSTALLMENT' | 'INVOICE_DUE';
export const itemTypeLabels: Record<CalendarItemType, string> = {
  TASK: 'Tarefa', EVENT: 'Evento', BILL: 'Conta a pagar/receber', RECURRING_BILL: 'Obrigação recorrente', DEBT_INSTALLMENT: 'Parcela de dívida', INVOICE_DUE: 'Fatura de cartão',
};
export interface CalendarItem {
  id: string; type: CalendarItemType; sourceId: string; title: string; date: string; startTime: string | null; endTime: string | null; allDay: boolean;
  status: string; done: boolean; amount: number | null; direction: 'IN' | 'OUT' | null; recurring: boolean; occurrenceDate: string | null; conflict: boolean;
  priority: TaskPriority | null; location: string | null; overdue: boolean; categoryId: string | null; editable: boolean;
}

export interface RecurringBill {
  id: string; description: string; type: 'INCOME' | 'EXPENSE'; amount: number; accountId: string; categoryId: string | null; paymentMethodId: string | null;
  active: boolean; notes: string | null; recurrence: Recurrence; nextOccurrence: string | null;
}
export interface RecurringInput {
  description: string; type: 'INCOME' | 'EXPENSE'; amount: number; accountId: string; categoryId: string | null; paymentMethodId: string | null;
  startDate: string; recurrence: RecurrenceInput; notes: string | null;
}

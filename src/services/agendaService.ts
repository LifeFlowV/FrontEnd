import type {
  AgendaEvent, CalendarItem, EventInput, EventStatus, HistoryEntry, RecurringBill, RecurringInput, Scope, Task, TaskInput, TaskStatus,
} from '../types/agenda';
import { api } from './api';

const qs = (p: Record<string, string | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v && q.set(k, v));
  const s = q.toString();
  return s ? `?${s}` : '';
};
const scoped = (scope?: Scope, occurrence?: string | null) => qs({ scope, occurrence: occurrence ?? undefined });

export interface TaskFilters { status?: string; priority?: string; categoryId?: string; q?: string; from?: string; to?: string }

export const taskService = {
  list: (f: TaskFilters) => api<Task[]>(`/tasks${qs({ ...f })}`),
  get: (id: string) => api<Task>(`/tasks/${id}`),
  history: (from: string, to: string) => api<HistoryEntry[]>(`/tasks/history${qs({ from, to })}`),
  create: (input: TaskInput) => api<Task>('/tasks', { method: 'POST', body: input }),
  update: (id: string, input: TaskInput, scope?: Scope, occurrence?: string | null) => api<Task>(`/tasks/${id}${scoped(scope, occurrence)}`, { method: 'PUT', body: input }),
  schedule: (id: string, body: { date: string | null; startTime: string | null; endTime: string | null }, scope?: Scope, occurrence?: string | null) =>
    api<Task>(`/tasks/${id}/schedule${scoped(scope, occurrence)}`, { method: 'PATCH', body }),
  status: (id: string, status: TaskStatus, occurrence?: string | null) => api<Task>(`/tasks/${id}/status${qs({ occurrence: occurrence ?? undefined })}`, { method: 'POST', body: { status } }),
  duplicate: (id: string) => api<Task>(`/tasks/${id}/duplicate`, { method: 'POST' }),
  remove: (id: string, scope?: Scope, occurrence?: string | null) => api<void>(`/tasks/${id}${scoped(scope, occurrence)}`, { method: 'DELETE' }),
};

export const eventService = {
  get: (id: string) => api<AgendaEvent>(`/events/${id}`),
  list: (from?: string, to?: string) => api<AgendaEvent[]>(`/events${qs({ from, to })}`),
  create: (input: EventInput) => api<AgendaEvent>('/events', { method: 'POST', body: input }),
  update: (id: string, input: EventInput, scope?: Scope, occurrence?: string | null) => api<AgendaEvent>(`/events/${id}${scoped(scope, occurrence)}`, { method: 'PUT', body: input }),
  schedule: (id: string, body: { date: string | null; startTime: string | null; endTime: string | null; allDay: boolean | null }, scope?: Scope, occurrence?: string | null) =>
    api<AgendaEvent>(`/events/${id}/schedule${scoped(scope, occurrence)}`, { method: 'PATCH', body }),
  status: (id: string, status: EventStatus, occurrence?: string | null) => api<AgendaEvent>(`/events/${id}/status${qs({ occurrence: occurrence ?? undefined })}`, { method: 'POST', body: { status } }),
  duplicate: (id: string) => api<AgendaEvent>(`/events/${id}/duplicate`, { method: 'POST' }),
  remove: (id: string, scope?: Scope, occurrence?: string | null) => api<void>(`/events/${id}${scoped(scope, occurrence)}`, { method: 'DELETE' }),
};

export const calendarService = {
  items: (from: string, to: string, types?: string, categoryId?: string, status?: string) => api<CalendarItem[]>(`/calendar${qs({ from, to, types, categoryId, status })}`),
};

export const recurringService = {
  list: () => api<RecurringBill[]>('/recurring'),
  create: (input: RecurringInput) => api<RecurringBill>('/recurring', { method: 'POST', body: input }),
  update: (id: string, input: RecurringInput) => api<RecurringBill>(`/recurring/${id}`, { method: 'PUT', body: input }),
  setActive: (id: string, active: boolean) => api<RecurringBill>(`/recurring/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST' }),
  settle: (id: string, occurrence: string, settledDate: string | null) => api<unknown>(`/recurring/${id}/settle`, { method: 'POST', body: { occurrence, settledDate } }),
  remove: (id: string) => api<void>(`/recurring/${id}`, { method: 'DELETE' }),
};

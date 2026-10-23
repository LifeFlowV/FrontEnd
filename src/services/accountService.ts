import type { Account, AccountInput } from '../types/account';
import { api } from './api';

export const accountService = {
  list: (includeArchived: boolean) => api<Account[]>(`/accounts?includeArchived=${includeArchived}`),
  create: (input: AccountInput) => api<Account>('/accounts', { method: 'POST', body: input }),
  update: (id: string, input: AccountInput) => api<Account>(`/accounts/${id}`, { method: 'PUT', body: input }),
  setArchived: (id: string, archived: boolean) =>
    api<Account>(`/accounts/${id}/${archived ? 'archive' : 'unarchive'}`, { method: 'POST' }),
};

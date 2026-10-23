import type { Category, CategoryInput, Tag, TagInput } from '../types/category';
import { api } from './api';

export const categoryService = {
  tree: (includeInactive: boolean) => api<Category[]>(`/categories?includeInactive=${includeInactive}`),
  create: (input: CategoryInput) => api<Category>('/categories', { method: 'POST', body: input }),
  update: (id: string, input: CategoryInput) => api<Category>(`/categories/${id}`, { method: 'PUT', body: input }),
  setActive: (id: string, active: boolean) =>
    api<Category>(`/categories/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST' }),
  remove: (id: string) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
  restoreDefaults: () => api<{ created: number }>('/categories/defaults', { method: 'POST' }),
};

export const tagService = {
  list: () => api<Tag[]>('/tags'),
  create: (input: TagInput) => api<Tag>('/tags', { method: 'POST', body: input }),
  update: (id: string, input: TagInput) => api<Tag>(`/tags/${id}`, { method: 'PUT', body: input }),
  remove: (id: string) => api<void>(`/tags/${id}`, { method: 'DELETE' }),
};

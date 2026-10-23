import type { LoginInput, RegisterInput, User } from '../types/auth';
import { ApiError, api } from './api';

export const authService = {
  /** Retorna null quando não há sessão ativa (401). Também serve para o servidor emitir o cookie CSRF. */
  async me(): Promise<User | null> {
    try {
      return await api<User>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  login: (input: LoginInput) => api<User>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) => api<User>('/auth/register', { method: 'POST', body: input }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
};

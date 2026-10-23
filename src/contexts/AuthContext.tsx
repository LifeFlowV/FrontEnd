import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { LoginInput, RegisterInput, User } from '../types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: authService.me, retry: false, staleTime: Infinity });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  });
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  });
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(['me'], null);
    },
  });

  const refetch = useCallback(() => void meQuery.refetch(), [meQuery]);

  const value = useMemo<AuthState>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: meQuery.isLoading,
      error: meQuery.error,
      refetch,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
    }),
    [meQuery.data, meQuery.isLoading, meQuery.error, refetch, loginMutation.mutateAsync, registerMutation.mutateAsync, logoutMutation.mutateAsync],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ErrorScreen, LoadingScreen } from './ScreenMessage';

function useAuthGate() {
  const auth = useAuth();
  if (auth.isLoading) return <LoadingScreen />;
  if (auth.error) return <ErrorScreen message={auth.error.message} onRetry={auth.refetch} />;
  return null;
}

export function ProtectedRoute() {
  const gate = useAuthGate();
  const { user } = useAuth();
  const location = useLocation();
  if (gate) return gate;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const gate = useAuthGate();
  const { user } = useAuth();
  if (gate) return gate;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

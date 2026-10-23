import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { AccountsPage } from './pages/AccountsPage';
import { CardsPage } from './pages/CardsPage';
import { DebtsPage } from './pages/DebtsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { ModulePage } from './pages/ModulePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { TutorialPage } from './pages/TutorialPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { InlineLoading } from './components/ScreenMessage';
import { modules, type ModuleDef } from './routes/modules';

const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));

function pageFor(m: ModuleDef) {
  switch (m.key) {
    case 'contas': return <AccountsPage />;
    case 'transacoes': return <TransactionsPage />;
    case 'cartoes': return <CardsPage />;
    case 'dividas': return <DebtsPage />;
    case 'calendario': return <CalendarPage />;
    case 'relatorios': return <ReportsPage />;
    case 'tarefas': return <TasksPage />;
    case 'categorias': return <CategoriesPage />;
    case 'configuracoes': return <SettingsPage />;
    default: return <ModulePage module={m} />;
  }
}

export default function App() {
  return (
    <Suspense fallback={<InlineLoading label="Carregando…" />}>
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tutorial" element={<TutorialPage />} />
          <Route path="financas" element={<Navigate to="/financas/transacoes" replace />} />
          <Route path="agenda" element={<Navigate to="/agenda/calendario" replace />} />
          {modules.map((m) => (
            <Route
              key={m.key}
              path={m.path}
              element={pageFor(m)}
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}

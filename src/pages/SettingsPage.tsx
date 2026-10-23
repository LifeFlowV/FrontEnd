import { ChangePasswordPanel } from '../features/settings/ChangePasswordPanel';
import { PaymentMethodsPanel } from '../features/transactions/PaymentMethodsPanel';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="page-header"><h1>Configurações</h1><p className="muted">Dados da sua conta.</p></header>
      <section className="card" aria-labelledby="perfil">
        <h2 id="perfil">Perfil</h2>
        <dl className="kv">
          <dt>Nome</dt><dd>{user?.name}</dd>
          <dt>E-mail</dt><dd>{user?.email}</dd>
          <dt>Fuso horário</dt><dd>{user?.timezone}</dd>
          <dt>Moeda</dt><dd>Real brasileiro (BRL)</dd>
        </dl>
        <button className="btn" onClick={() => void logout()}>Sair da conta</button>
      </section>
      <ChangePasswordPanel />
      <PaymentMethodsPanel />
    </>
  );
}

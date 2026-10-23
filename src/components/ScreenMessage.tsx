import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

function SlowConnectionHint() {
  const [isSlow, setIsSlow] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setIsSlow(true), 10000);
    return () => window.clearTimeout(timeout);
  }, []);
  return isSlow ? <span className="connection-hint">O servidor pode estar iniciando após um período sem uso. Mantenha esta página aberta; vamos tentar novamente automaticamente.</span> : null;
}

export function LoadingScreen() {
  return (
    <div className="screen-center" role="status">
      <Loader2 className="spin" aria-hidden="true" />
      <span>Carregando…</span>
      <SlowConnectionHint />
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="screen-center" role="alert">
      <h1>Não foi possível carregar o LifeFlow</h1>
      <p>{message}</p>
      <p className="muted">Se você voltou ao site após um período sem uso, o servidor pode estar iniciando. Tente novamente em alguns instantes.</p>
      <button className="btn" onClick={onRetry}>Tentar novamente</button>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function InlineLoading({ label }: { label: string }) {
  return (
    <div className="inline-state" role="status">
      <Loader2 className="spin" size={18} aria-hidden="true" /> <span>{label}</span>
      <SlowConnectionHint />
    </div>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="inline-state inline-error" role="alert">
      <span>{message}</span>
      <button className="btn" onClick={onRetry}>Tentar novamente</button>
    </div>
  );
}

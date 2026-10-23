import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingScreen() {
  return (
    <div className="screen-center" role="status">
      <Loader2 className="spin" aria-hidden="true" />
      <span>Carregando…</span>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="screen-center" role="alert">
      <h1>Não foi possível carregar o LifeFlow</h1>
      <p>{message}</p>
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

import type { ReactNode } from 'react';
import { Logo } from '../components/Logo';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-brand" aria-hidden="true">
        <div className="brand"><Logo size={36} /> <span>LifeFlow</span></div>
        <p className="auth-tagline">Seu dinheiro e sua rotina no mesmo lugar.</p>
      </section>
      <main className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

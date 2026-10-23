import { Hammer } from 'lucide-react';
import { EmptyState } from '../components/ScreenMessage';
import type { ModuleDef } from '../routes/modules';

/** Estado vazio explícito para módulos ainda não implementados: sem botões nem dados fictícios. */
export function ModulePage({ module }: { module: ModuleDef }) {
  return (
    <>
      <header className="page-header"><h1>{module.label}</h1><p className="muted">{module.summary}</p></header>
      <div className="card">
        <EmptyState icon={<Hammer size={22} />} title={`Este módulo chega na Fase ${module.phase}`}>
          <p className="muted">O que estará disponível:</p>
          <ul className="plain-list">{module.features?.map((f) => <li key={f}>{f}</li>)}</ul>
        </EmptyState>
      </div>
    </>
  );
}

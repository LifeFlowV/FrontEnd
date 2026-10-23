import { useCallback, useState } from 'react';
import { Dialog } from '../../components/Dialog';
import type { Scope } from '../../types/agenda';

const options: { value: Scope; label: string; hint: string }[] = [
  { value: 'THIS', label: 'Apenas esta ocorrência', hint: 'As demais permanecem como estão.' },
  { value: 'THIS_AND_FOLLOWING', label: 'Esta e as próximas', hint: 'As anteriores (histórico) não são alteradas.' },
  { value: 'ALL', label: 'Toda a série', hint: 'Aplica a todas as ocorrências futuras da série.' },
];

/** Pergunta qual escopo aplicar em itens recorrentes. Devolve null se o usuário cancelar. */
export function useScopeChoice() {
  const [state, setState] = useState<{ title: string; resolve: (s: Scope | null) => void } | null>(null);
  const [scope, setScope] = useState<Scope>('THIS');

  const choose = useCallback((title: string) => new Promise<Scope | null>((resolve) => { setScope('THIS'); setState({ title, resolve }); }), []);
  const close = (value: Scope | null) => { state?.resolve(value); setState(null); };

  const dialog = (
    <Dialog open={state !== null} onClose={() => close(null)} title={state?.title ?? ''}>
      <fieldset className="scope-options">
        <legend className="sr-only">Escopo da alteração</legend>
        {options.map((o) => (
          <label key={o.value} className="scope-option">
            <input type="radio" name="scope" checked={scope === o.value} onChange={() => setScope(o.value)} />
            <span><strong>{o.label}</strong><br /><span className="muted small">{o.hint}</span></span>
          </label>
        ))}
      </fieldset>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={() => close(null)}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={() => close(scope)}>Continuar</button>
      </div>
    </Dialog>
  );
  return { choose, dialog };
}

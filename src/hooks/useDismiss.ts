import { useEffect, type RefObject } from 'react';

/** Fecha um menu ao clicar/focar fora ou ao pressionar Esc (devolvendo o foco ao botão que o abriu). */
export function useDismiss(
  container: RefObject<HTMLElement>,
  open: boolean,
  onClose: () => void,
  trigger?: RefObject<HTMLElement>,
) {
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      if (!container.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        trigger?.current?.focus();
      }
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', onKey);
    };
  }, [container, open, onClose, trigger]);
}

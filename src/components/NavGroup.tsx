import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDismiss } from '../hooks/useDismiss';
import type { NavEntry } from '../routes/modules';

type Group = Extract<NavEntry, { kind: 'group' }>;

export function NavGroup({ group }: { group: Group }) {
  const { label, icon: Icon, items } = group;
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const root = useRef<HTMLLIElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = items.some((i) => pathname.startsWith(`/${i.path}`));
  const close = useCallback(() => setOpen(false), []);

  useEffect(close, [pathname, close]);
  useDismiss(root, open, close, button);

  return (
    <li ref={root} className="nav-item">
      <button
        ref={button}
        type="button"
        className="nav-link"
        data-active={active}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={14} aria-hidden="true" className="chevron" />
      </button>
      {open && (
        <ul id={menuId} className="dropdown" aria-label={label}>
          {items.map(({ key, path, label: itemLabel, icon: ItemIcon }) => (
            <li key={key}>
              <NavLink to={`/${path}`} className="dropdown-link">
                <ItemIcon size={18} aria-hidden="true" /> {itemLabel}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

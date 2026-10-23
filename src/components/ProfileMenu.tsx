import { ChevronDown, LogOut } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDismiss } from '../hooks/useDismiss';
import { profileModules } from '../routes/modules';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(close, [pathname, close]);
  useDismiss(root, open, close, button);

  if (!user) return null;
  return (
    <div ref={root} className="profile">
      <button
        ref={button}
        type="button"
        className="profile-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Menu do perfil de ${user.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="profile-name">{user.name.split(' ')[0]}</span>
        <ChevronDown size={14} aria-hidden="true" className="chevron" />
      </button>
      {open && (
        <div id={menuId} className="dropdown dropdown-right" role="group" aria-label="Perfil">
          <div className="profile-head">
            <strong>{user.name}</strong>
            <span className="muted">{user.email}</span>
          </div>
          <ul>
            {profileModules.map(({ key, path, label, icon: Icon }) => (
              <li key={key}>
                <NavLink to={`/${path}`} className="dropdown-link"><Icon size={18} aria-hidden="true" /> {label}</NavLink>
              </li>
            ))}
          </ul>
          <div className="dropdown-sep" />
          <button type="button" className="dropdown-link dropdown-btn" onClick={() => void logout()}>
            <LogOut size={18} aria-hidden="true" /> Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

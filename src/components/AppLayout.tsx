import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { mainNav } from '../routes/modules';
import { Logo } from './Logo';
import { NavGroup } from './NavGroup';
import { ProfileMenu } from './ProfileMenu';

export function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => { document.getElementById('conteudo')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>

      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand" aria-label="LifeFlow, ir para a Visão geral">
            <Logo size={30} /> <span>LifeFlow</span>
          </NavLink>

          <nav className="mainnav" aria-label="Principal">
            <ul>
              {mainNav.map((entry) =>
                entry.kind === 'group' ? (
                  <NavGroup key={entry.key} group={entry} />
                ) : (
                  <li key={entry.key} className="nav-item">
                    <NavLink to={entry.to} end={entry.end} className="nav-link">
                      <entry.icon size={18} aria-hidden="true" /> <span>{entry.label}</span>
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <ProfileMenu />
        </div>
      </header>

      <main id="conteudo" className="content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { mainNav } from '../routes/modules';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from './Dialog';
import { Logo } from './Logo';
import { NavGroup } from './NavGroup';
import { ProfileMenu } from './ProfileMenu';

export function AppLayout() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const tutorialKey = user ? `lifeflow:tutorial-completed:${user.id}` : undefined;
  const navState = location.state as { startTutorial?: boolean; forceTutorial?: boolean } | null;
  const tour = [
    { title: 'Visão geral', text: 'Acompanhe o saldo, as entradas e saídas do mês e os próximos compromissos. Use este painel como ponto de partida para revisar sua vida financeira.', to: '/' },
    { title: 'Prepare suas finanças', text: 'Cadastre suas contas, formas de pagamento, categorias e etiquetas. Isso mantém os lançamentos organizados e facilita os filtros e relatórios.', to: '/financas/contas' },
    { title: 'Registre movimentações', text: 'Lance receitas e despesas como planejadas ou efetivadas. Use transferências para mover dinheiro entre suas próprias contas.', to: '/financas/transacoes' },
    { title: 'Acompanhe cartões e dívidas', text: 'Cadastre cartões e compras parceladas para acompanhar faturas e limite. Registre dívidas para ver parcelas, juros, pagamentos parciais e saldo restante.', to: '/financas/cartoes' },
    { title: 'Organize sua agenda', text: 'Use o calendário para compromissos e vencimentos. Crie tarefas, subtarefas e recorrências, defina prioridades e acompanhe o que foi concluído.', to: '/agenda/calendario' },
    { title: 'Analise e ajuste', text: 'Consulte relatórios financeiros, de obrigações e produtividade. Volte às categorias e configurações para ajustar sua organização e seus dados.', to: '/relatorios' },
  ];
  useEffect(() => {
    if (navState?.startTutorial && tutorialKey && (navState.forceTutorial || !localStorage.getItem(tutorialKey))) {
      setTutorialStep(0);
      setTutorialOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, navState, navigate, tutorialKey]);
  const closeTutorial = () => {
    setTutorialOpen(false);
    if (tutorialKey) localStorage.setItem(tutorialKey, 'true');
  };
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
      <Dialog open={tutorialOpen} onClose={closeTutorial} title="Primeiros passos no LifeFlow">
        <div className="tutorial-progress" aria-label={`Passo ${tutorialStep + 1} de ${tour.length}`}>
          <span style={{ width: `${((tutorialStep + 1) / tour.length) * 100}%` }} />
        </div>
        <p className="muted">Passo {tutorialStep + 1} de {tour.length}</p>
        <h3 className="tutorial-step-title">{tour[tutorialStep].title}</h3>
        <p>{tour[tutorialStep].text}</p>
        <div className="tutorial-tour-actions">
          <button type="button" className="btn" onClick={() => navigate(tour[tutorialStep].to)}>Abrir esta área</button>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={closeTutorial}>Pular tutorial</button>
            {tutorialStep > 0 && <button type="button" className="btn" onClick={() => setTutorialStep((step) => step - 1)}>Voltar</button>}
            {tutorialStep < tour.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setTutorialStep((step) => step + 1)}>Próximo</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={closeTutorial}>Concluir</button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

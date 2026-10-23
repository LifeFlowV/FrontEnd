import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const chapters = [
  {
    title: '1. Comece pela estrutura',
    text: 'Cadastre suas contas com o saldo inicial e a data correspondente. Depois organize categorias, etiquetas e formas de pagamento. Essa base ajuda a manter os lançamentos consistentes.',
    links: [{ label: 'Contas', to: '/financas/contas' }, { label: 'Categorias e etiquetas', to: '/categorias' }, { label: 'Transações', to: '/financas/transacoes' }],
    tips: ['Use uma conta para cada banco, carteira ou reserva que deseja acompanhar.', 'Crie categorias claras, como moradia, alimentação e trabalho.', 'O saldo inicial deve refletir o valor real na data escolhida.'],
  },
  {
    title: '2. Registre receitas, despesas e transferências',
    text: 'Em Transações, informe descrição, valor, data, conta e categoria. Uma movimentação planejada aparece nos compromissos futuros; ao efetivá-la, ela passa a compor o realizado. Transferências movimentam valores entre duas contas sem tratá-los como renda ou despesa.',
    links: [{ label: 'Abrir transações', to: '/financas/transacoes' }],
    tips: ['Use a data de competência para indicar a que período o lançamento pertence.', 'Informe vencimento para contas ainda pendentes.', 'Use Transferência para aportes e movimentações entre contas próprias.'],
  },
  {
    title: '3. Controle cartões e dívidas',
    text: 'Cadastre o cartão com limite, fechamento, vencimento e conta usada para pagar a fatura. Registre compras pelo módulo de Cartões para distribuir as parcelas entre faturas. Em Dívidas, informe o contrato e o cronograma para acompanhar saldo, juros e pagamentos parciais.',
    links: [{ label: 'Cartões', to: '/financas/cartoes' }, { label: 'Dívidas', to: '/financas/dividas' }],
    tips: ['Compras com cartão são registradas em Cartões, não como uma despesa comum.', 'Confira o valor e o vencimento de cada fatura.', 'Pagamentos parciais preservam o saldo restante até a quitação.'],
  },
  {
    title: '4. Planeje tarefas e compromissos',
    text: 'O Calendário reúne tarefas, eventos e vencimentos financeiros. Tarefas podem ter data, horário, prioridade, etiquetas, subtarefas e recorrência. Eventos registram compromissos e podem avisar sobre conflitos de horário.',
    links: [{ label: 'Calendário', to: '/agenda/calendario' }, { label: 'Tarefas', to: '/agenda/tarefas' }],
    tips: ['Use prioridades para destacar o que precisa de atenção primeiro.', 'Marque tarefas como concluídas para acompanhar seu histórico.', 'Configure recorrência para compromissos e tarefas repetidos.'],
  },
  {
    title: '5. Automatize obrigações recorrentes',
    text: 'Cadastre entradas ou saídas que se repetem, como salário, aluguel e assinaturas. Defina frequência, intervalo e dia da ocorrência. As obrigações ajudam a projetar o fluxo de caixa e aparecem na agenda.',
    links: [{ label: 'Abrir calendário e recorrências', to: '/agenda/calendario' }],
    tips: ['Revise as datas de início e fim das regras.', 'A ocorrência recorrente não substitui a conferência do pagamento efetivo.', 'Atualize ou pause regras quando uma obrigação mudar.'],
  },
  {
    title: '6. Revise relatórios e configurações',
    text: 'O painel mostra um resumo do período. Relatórios ajudam a comparar receitas e despesas, identificar gastos por categoria e acompanhar obrigações e produtividade. Em Configurações, revise os dados da conta e as opções disponíveis.',
    links: [{ label: 'Visão geral', to: '/' }, { label: 'Relatórios', to: '/relatorios' }, { label: 'Configurações', to: '/configuracoes' }],
    tips: ['Compare valores planejados e realizados.', 'Filtre os relatórios por período para investigar mudanças.', 'Mantenha seus dados de acesso atualizados.'],
  },
];

export function TutorialPage() {
  const navigate = useNavigate();
  return (
    <>
      <header className="page-header tutorial-header">
        <div className="tutorial-heading-icon"><BookOpen size={24} aria-hidden="true" /></div>
        <div>
          <h1>Tutorial do LifeFlow</h1>
          <p className="muted">Um guia para organizar suas finanças, compromissos e tarefas.</p>
        </div>
        <button type="button" className="btn btn-primary tutorial-restart" onClick={() => navigate('/tutorial', { state: { startTutorial: true, forceTutorial: true } })}>Iniciar tour guiado</button>
      </header>

      <section className="card tutorial-welcome" aria-labelledby="tutorial-welcome-title">
        <h2 id="tutorial-welcome-title">Fluxo sugerido para começar</h2>
        <ol className="tutorial-flow">
          <li><span>1</span> Cadastre contas e categorias.</li>
          <li><span>2</span> Registre receitas e despesas.</li>
          <li><span>3</span> Configure cartões, dívidas e recorrências.</li>
          <li><span>4</span> Organize tarefas e compromissos.</li>
          <li><span>5</span> Acompanhe o painel e os relatórios.</li>
        </ol>
      </section>

      <div className="tutorial-chapters">
        {chapters.map((chapter) => (
          <section className="card tutorial-chapter" key={chapter.title}>
            <h2>{chapter.title}</h2>
            <p>{chapter.text}</p>
            <ul className="tutorial-tips">
              {chapter.tips.map((tip) => <li key={tip}><CheckCircle2 size={17} aria-hidden="true" /> <span>{tip}</span></li>)}
            </ul>
            <div className="tutorial-links">
              {chapter.links.map((link) => (
                <button type="button" className="tutorial-link" key={link.to + link.label} onClick={() => navigate(link.to)}>
                  {link.label} <ArrowRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

import {
  ArrowLeftRight, BarChart3, BookOpen, CalendarDays, CreditCard, HandCoins, Landmark, LayoutDashboard, ListChecks, Settings, Tags, Wallet,
  type LucideIcon,
} from 'lucide-react';

/** Página roteável. O Dashboard é tratado à parte (rota índice). */
export interface ModuleDef {
  key: string;
  path: string; // relativo à raiz
  label: string;
  icon: LucideIcon;
  /** Fase do roadmap em que o módulo passa a funcionar. */
  phase?: number;
  summary?: string;
  features?: string[];
}

export const modules: ModuleDef[] = [
  {
    key: 'transacoes', path: 'financas/transacoes', label: 'Transações', icon: ArrowLeftRight,
    summary: 'Receitas, despesas e transferências com saldo realizado e previsto.',
    features: ['Receitas, despesas e transferências', 'Filtros por período, categoria e conta', 'Planejado × efetivado'],
  },
  {
    key: 'contas', path: 'financas/contas', label: 'Contas', icon: Landmark,
    summary: 'Contas correntes, poupanças, carteiras e investimentos.',
    features: ['Cadastro e arquivamento de contas', 'Saldo calculado a partir das movimentações', 'Transferências entre contas'],
  },
  {
    key: 'cartoes', path: 'financas/cartoes', label: 'Cartões', icon: CreditCard,
    summary: 'Cartões de crédito, faturas e compras parceladas.',
    features: ['Limite e limite comprometido', 'Parcelamento com arredondamento consistente', 'Pagamento de fatura'],
  },
  {
    key: 'dividas', path: 'financas/dividas', label: 'Dívidas', icon: HandCoins,
    summary: 'Cronograma de parcelas, pagamentos parciais e saldo restante.',
    features: ['Parcelas com juros e encargos', 'Previsão de pagamento por mês', 'Total pago e restante'],
  },
  {
    key: 'calendario', path: 'agenda/calendario', label: 'Calendário', icon: CalendarDays,
    summary: 'Compromissos, tarefas e vencimentos financeiros em um só calendário.',
    features: ['Visões dia, semana, mês e lista', 'Arrastar e redimensionar blocos', 'Recorrências'],
  },
  {
    key: 'tarefas', path: 'agenda/tarefas', label: 'Tarefas', icon: ListChecks,
    summary: 'Tarefas, subtarefas e eventos com prioridade e etiquetas.',
    features: ['Subtarefas e checklists', 'Prioridades e status', 'Eventos com aviso de conflito'],
  },
  {
    key: 'relatorios', path: 'relatorios', label: 'Relatórios', icon: BarChart3,
    summary: 'Gráficos e filtros sobre seus dados financeiros e de produtividade.',
    features: ['Receitas × despesas', 'Gastos por categoria e forma de pagamento', 'Taxa de conclusão de tarefas'],
  },
  {
    key: 'categorias', path: 'categorias', label: 'Categorias e etiquetas', icon: Tags,
    summary: 'Categorias, subcategorias e etiquetas personalizáveis.',
    features: ['Categorias padrão e personalizadas', 'Subcategorias', 'Etiquetas independentes'],
  },
  { key: 'configuracoes', path: 'configuracoes', label: 'Configurações', icon: Settings },
];

const byKey = (key: string) => {
  const found = modules.find((m) => m.key === key);
  if (!found) throw new Error(`Módulo desconhecido: ${key}`);
  return found;
};

export type NavEntry =
  | { kind: 'link'; key: string; label: string; icon: LucideIcon; to: string; end?: boolean }
  | { kind: 'group'; key: string; label: string; icon: LucideIcon; items: ModuleDef[] };

/** Navegação principal: 4 entradas. Categorias e Configurações ficam no menu do perfil. */
export const mainNav: NavEntry[] = [
  { kind: 'link', key: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard, to: '/', end: true },
  { kind: 'group', key: 'financas', label: 'Finanças', icon: Wallet, items: ['transacoes', 'contas', 'cartoes', 'dividas'].map(byKey) },
  { kind: 'group', key: 'agenda', label: 'Agenda', icon: CalendarDays, items: ['calendario', 'tarefas'].map(byKey) },
  { kind: 'link', key: 'relatorios', label: 'Relatórios', icon: BarChart3, to: `/${byKey('relatorios').path}` },
  { kind: 'link', key: 'tutorial', label: 'Tutorial', icon: BookOpen, to: '/tutorial' },
];

export const profileModules: ModuleDef[] = ['categorias', 'configuracoes'].map(byKey);

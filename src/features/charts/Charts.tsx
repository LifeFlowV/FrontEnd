import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatBRL } from '../../utils/format';

export const COLORS = { income: '#14704A', expense: '#B4410B', accent: '#4B3FD4', amber: '#8F5B00', blue: '#0F6E8C', rose: '#B4234A', slate: '#475569' };
const PIE = ['#4B3FD4', '#B4410B', '#0F6E8C', '#8F5B00', '#B4234A', '#14704A', '#8A3FB0', '#475569', '#3B5FC0', '#A33C7C'];
const money = (v: unknown) => formatBRL(Number(v ?? 0));
const compact = (v: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
export const monthLabel = (ym: string) => { const [y, m] = ym.split('-'); return `${m}/${y.slice(2)}`; };

/** Cartão de gráfico com tabela equivalente (somente leitores de tela), pois o gráfico em si é visual. */
export function ChartCard({ title, children, columns, rows, empty }: { title: string; children: ReactNode; columns: string[]; rows: (string | number)[][]; empty?: boolean }) {
  return (
    <section className="card chart-card" aria-label={title}>
      <h2>{title}</h2>
      {empty ? <p className="muted">Sem dados no período.</p> : <div role="img" aria-label={`Gráfico: ${title}. Os dados estão na tabela a seguir.`}>{children}</div>}
      <table className="sr-only"><caption>{title}</caption>
        <thead><tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </section>
  );
}

export function IncomeExpenseChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.map((d) => ({ ...d, name: monthLabel(d.month) }))}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={compact} width={48} />
        <Tooltip formatter={money} /><Legend />
        <Bar dataKey="income" name="Receitas" fill={COLORS.income} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" name="Despesas" fill={COLORS.expense} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data, name, color = COLORS.accent }: { data: { month: string; value: number }[]; name: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data.map((d) => ({ ...d, label: monthLabel(d.month) }))}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis tickFormatter={compact} width={48} />
        <Tooltip formatter={money} />
        <Line type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PieByName({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
        </Pie>
        <Tooltip formatter={money} /><Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34 + 30)}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={compact} /><YAxis type="category" dataKey="name" width={120} />
        <Tooltip formatter={money} />
        <Bar dataKey="amount" name="Valor" fill={COLORS.accent} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedObligations({ data }: { data: { month: string; debts: number; cards: number; recurring: number; other: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.map((d) => ({ ...d, name: monthLabel(d.month) }))}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={compact} width={48} />
        <Tooltip formatter={money} /><Legend />
        <Bar dataKey="debts" name="Dívidas" stackId="a" fill={COLORS.rose} />
        <Bar dataKey="cards" name="Faturas de cartão" stackId="a" fill={COLORS.slate} />
        <Bar dataKey="recurring" name="Recorrentes" stackId="a" fill={COLORS.amber} />
        <Bar dataKey="other" name="Outras contas" stackId="a" fill={COLORS.expense} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SingleBars({ data, name, color = COLORS.blue }: { data: { month: string; value: number }[]; name: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data.map((d) => ({ ...d, label: monthLabel(d.month) }))}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis tickFormatter={compact} width={48} />
        <Tooltip formatter={money} /><Bar dataKey="value" name={name} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

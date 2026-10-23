const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Moeda padrão do sistema: BRL. */
export const formatBRL = (value: number) => brl.format(value);

/** Número com duas casas e vírgula (1.234,56), para preencher campos de valor. */
export const formatDecimal = (value: number) => decimal.format(value);

/**
 * Interpreta um valor digitado em pt-BR ("1.234,56", "-250", "R$ 10,5"). Retorna null se for ambíguo ou inválido.
 * Ponto só é aceito como separador de milhar; "1234.56" é recusado de propósito para não virar 123.456,00.
 */
export function parseBRL(input: string): number | null {
  const value = input.replace(/R\$|\s/g, '');
  if (!/^-?(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/.test(value)) return null;
  return Number(value.replace(/\./g, '').replace(',', '.'));
}

/** Datas exibidas como DD/MM/AAAA. Datas sem hora (AAAA-MM-DD) não passam por fuso horário. */
export function formatDate(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

/** Data de hoje no fuso do navegador, no formato AAAA-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const formatLongDate = (value: Date) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(value);

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Primeiro e último dia do mês da data informada, como AAAA-MM-DD. */
export function monthRange(date: Date = new Date()): { from: string; to: string } {
  return { from: iso(new Date(date.getFullYear(), date.getMonth(), 1)), to: iso(new Date(date.getFullYear(), date.getMonth() + 1, 0)) };
}

export const toISODate = iso;

const WEEKDAY_SHORT: Record<string, string> = { MONDAY: 'seg', TUESDAY: 'ter', WEDNESDAY: 'qua', THURSDAY: 'qui', FRIDAY: 'sex', SATURDAY: 'sáb', SUNDAY: 'dom' };

/** Texto legível da regra de repetição (ex.: "Toda semana: seg, qua, sex"). */
export function describeRecurrence(r: { frequency: string; interval: number; weekdays: string[]; monthMode: string | null; monthDay: number | null; until: string | null }): string {
  const every = (n: number, one: string, many: string) => (n === 1 ? `Todo ${one}` : `A cada ${n} ${many}`);
  let text: string;
  switch (r.frequency) {
    case 'DAILY': text = r.interval === 1 ? 'Todos os dias' : `A cada ${r.interval} dias`; break;
    case 'WEEKLY': text = `${r.interval === 1 ? 'Toda semana' : `A cada ${r.interval} semanas`}${r.weekdays.length ? `: ${r.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')}` : ''}`; break;
    case 'MONTHLY':
      text = r.monthMode === 'LAST_BUSINESS_DAY' ? 'Último dia útil do mês' : r.monthMode === 'LAST_DAY' ? 'Último dia do mês'
        : `${every(r.interval, 'mês', 'meses')}${r.monthDay ? `, no dia ${r.monthDay}` : ''}`;
      break;
    default: text = every(r.interval, 'ano', 'anos');
  }
  return r.until ? `${text} (até ${formatDate(r.until)})` : text;
}

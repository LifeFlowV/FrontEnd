import { describe, expect, it } from 'vitest';
import { currentMonth, describeRecurrence, formatDate, formatDecimal, monthRange, parseBRL } from './format';

describe('parseBRL', () => {
  it.each([['1.234,56', 1234.56], ['1234,5', 1234.5], ['1234', 1234], ['-250', -250], ['R$ 10,50', 10.5], ['1.234', 1234], ['0,99', 0.99]])('aceita %s', (input, expected) => {
    expect(parseBRL(input)).toBe(expected);
  });
  it.each(['1234.56', '1.5', 'abc', '', '1,234,56', '10,123', '1.23.456'])('recusa %s para não virar valor errado', (input) => {
    expect(parseBRL(input)).toBeNull();
  });
});

describe('datas', () => {
  it('calcula o mês no fuso local em vez de converter a data para UTC', () => {
    expect(currentMonth(new Date(2026, 9, 1, 0, 30))).toBe('2026-10');
    expect(currentMonth(new Date(2026, 0, 31, 23, 30))).toBe('2026-01');
  });
  it('formata datas sem hora sem deslocar o dia por fuso', () => {
    expect(formatDate('2026-10-19')).toBe('19/10/2026');
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
  });
  it('calcula o primeiro e o último dia do mês, inclusive em fevereiro bissexto', () => {
    expect(monthRange(new Date(2028, 1, 10))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(monthRange(new Date(2026, 1, 10))).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});

describe('números e recorrência', () => {
  it('usa vírgula e duas casas', () => expect(formatDecimal(1234.5)).toBe('1.234,50'));
  it('descreve repetições em português', () => {
    const base = { interval: 1, weekdays: [] as string[], monthMode: null, monthDay: null, until: null };
    expect(describeRecurrence({ ...base, frequency: 'WEEKLY', weekdays: ['MONDAY', 'WEDNESDAY'] })).toBe('Toda semana: seg, qua');
    expect(describeRecurrence({ ...base, frequency: 'MONTHLY', monthDay: 10 })).toBe('Todo mês, no dia 10');
    expect(describeRecurrence({ ...base, frequency: 'MONTHLY', monthMode: 'LAST_BUSINESS_DAY' })).toBe('Último dia útil do mês');
    expect(describeRecurrence({ ...base, frequency: 'DAILY', interval: 2, until: '2026-12-31' })).toBe('A cada 2 dias (até 31/12/2026)');
  });
});

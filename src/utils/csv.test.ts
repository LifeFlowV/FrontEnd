import { describe, expect, it } from 'vitest';
import { serializeCsv } from './csv';

describe('serializeCsv', () => {
  it('quotes delimiters, quotes, and line breaks', () => {
    const csv = serializeCsv([{ description: 'Mercado; "Centro"\nfilial' }], [
      { label: 'Descrição', value: (row) => row.description },
    ]);

    expect(csv).toBe('"Descrição"\r\n"Mercado; ""Centro""\nfilial"');
  });

  it('neutralizes spreadsheet formulas in user text and preserves numeric values', () => {
    const csv = serializeCsv([{ description: '=HYPERLINK("https://example.test")', amount: -12.5 }], [
      { label: 'Descrição', value: (row) => row.description },
      { label: 'Valor', value: (row) => row.amount },
    ]);

    expect(csv).toBe('"Descrição";"Valor"\r\n"\'=HYPERLINK(""https://example.test"")";"-12.5"');
  });
});

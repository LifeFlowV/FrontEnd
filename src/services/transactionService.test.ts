import { afterEach, describe, expect, it, vi } from 'vitest';
import { transactionService } from './transactionService';

afterEach(() => vi.unstubAllGlobals());

describe('transactionService.listAll', () => {
  it('fetches every page using the active filters and sort order', async () => {
    const page = (number: number, content: { id: string }[]) => ({ content, page: number, size: 100, totalPages: 2, totalElements: 2 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page(0, [{ id: 'first' }])), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(page(1, [{ id: 'second' }])), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const rows = await transactionService.listAll({ from: '2026-10-01', status: 'SETTLED', q: 'mercado' }, 'amount', 'asc');

    expect(rows.map((row) => row.id)).toEqual(['first', 'second']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('from=2026-10-01');
    expect(String(fetchMock.mock.calls[0][0])).toContain('status=SETTLED');
    expect(String(fetchMock.mock.calls[1][0])).toContain('page=1');
    expect(String(fetchMock.mock.calls[1][0])).toContain('sort=amount');
  });
});

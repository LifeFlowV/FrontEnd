export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return '""';
  const text = String(value);
  // Prevent spreadsheet formulas in user-controlled text such as descriptions and notes.
  const safe = typeof value === 'string' && /^[\t\r ]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function serializeCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(({ label }) => csvCell(label)).join(';');
  const body = rows.map((row) => columns.map(({ value }) => csvCell(value(row))).join(';'));
  return [header, ...body].join('\r\n');
}

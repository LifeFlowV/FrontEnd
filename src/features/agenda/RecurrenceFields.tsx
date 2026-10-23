import { useState } from 'react';
import { Field, SelectField } from '../../components/Field';
import { weekdayOrder, weekdayShort, type Frequency, type MonthMode, type RecurrenceInput, type Weekday } from '../../types/agenda';

/** Editor controlado de repetição. Retorna null quando "não repete". */
export function RecurrenceFields({ value, onChange, startDate }: { value: RecurrenceInput | null; onChange: (v: RecurrenceInput | null) => void; startDate: string }) {
  const [last, setLast] = useState<RecurrenceInput>(value ?? { frequency: 'WEEKLY', interval: 1, weekdays: [], monthMode: 'DAY_OF_MONTH', monthDay: null, until: null });
  const rule = value ?? last;
  const set = (patch: Partial<RecurrenceInput>) => { const next = { ...rule, ...patch }; setLast(next); onChange(next); };

  return (
    <fieldset className="picker recurrence">
      <legend>Repetição</legend>
      <label className="check form-check">
        <input type="checkbox" checked={value !== null} onChange={(e) => onChange(e.target.checked ? rule : null)} /> Repetir
      </label>
      {value && (
        <>
          <div className="form-row">
            <SelectField label="Frequência" value={rule.frequency} onChange={(e) => set({ frequency: e.target.value as Frequency })}
              options={[{ value: 'DAILY', label: 'Diariamente' }, { value: 'WEEKLY', label: 'Semanalmente' }, { value: 'MONTHLY', label: 'Mensalmente' }, { value: 'YEARLY', label: 'Anualmente' }]} />
            <Field label="A cada" type="number" min={1} max={365} value={rule.interval} onChange={(e) => set({ interval: Math.max(1, Number(e.target.value) || 1) })}
              hint={rule.frequency === 'DAILY' ? 'dia(s)' : rule.frequency === 'WEEKLY' ? 'semana(s)' : rule.frequency === 'MONTHLY' ? 'mês(es)' : 'ano(s)'} />
          </div>
          {rule.frequency === 'WEEKLY' && (
            <div className="weekdays" role="group" aria-label="Dias da semana">
              {weekdayOrder.map((d: Weekday) => (
                <label key={d} className="chip-check">
                  <input type="checkbox" checked={rule.weekdays.includes(d)} onChange={(e) => set({ weekdays: e.target.checked ? [...rule.weekdays, d] : rule.weekdays.filter((x) => x !== d) })} />
                  <span>{weekdayShort[d]}</span>
                </label>
              ))}
              <p className="field-hint">Sem dias marcados, repete no mesmo dia da semana da data inicial ({startDate || 'escolha a data'}).</p>
            </div>
          )}
          {rule.frequency === 'MONTHLY' && (
            <div className="form-row">
              <SelectField label="Dia do mês" value={rule.monthMode ?? 'DAY_OF_MONTH'} onChange={(e) => set({ monthMode: e.target.value as MonthMode })}
                options={[{ value: 'DAY_OF_MONTH', label: 'Dia fixo' }, { value: 'LAST_DAY', label: 'Último dia do mês' }, { value: 'LAST_BUSINESS_DAY', label: 'Último dia útil' }]} />
              {(rule.monthMode ?? 'DAY_OF_MONTH') === 'DAY_OF_MONTH' && (
                <Field label="Dia (opcional)" type="number" min={1} max={31} value={rule.monthDay ?? ''} hint="Vazio = dia da data inicial. Meses curtos usam o último dia."
                  onChange={(e) => set({ monthDay: e.target.value ? Math.min(31, Math.max(1, Number(e.target.value))) : null })} />
              )}
            </div>
          )}
          <Field label="Repetir até (opcional)" type="date" min={startDate || undefined} value={rule.until ?? ''} onChange={(e) => set({ until: e.target.value || null })} />
        </>
      )}
    </fieldset>
  );
}

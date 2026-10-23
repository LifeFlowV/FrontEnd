import type { DateSelectArg, DatesSetArg, EventClickArg, EventContentArg, EventDropArg, EventInput as FcEventInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { SelectField } from '../components/Field';
import { InlineError } from '../components/ScreenMessage';
import { EventForm, TaskForm } from '../features/agenda/AgendaForms';
import { useScopeChoice } from '../features/agenda/ScopeDialog';
import { categoryOptions, useLookups } from '../hooks/useLookups';
import { useAgendaMutations, useCalendarItems, useTransactionMutations } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import { eventService, taskService } from '../services/agendaService';
import { eventStatusLabels, itemTypeLabels, type AgendaEvent, type CalendarItem, type CalendarItemType, type EventInput, type EventStatus, type Scope, type Task, type TaskInput } from '../types/agenda';
import { errorMessage } from '../utils/forms';
import { formatBRL, formatDate, toISODate } from '../utils/format';

const TYPE_COLORS: Record<CalendarItemType, string> = {
  TASK: '#4B3FD4', EVENT: '#0F6E8C', BILL: '#B4410B', RECURRING_BILL: '#8F5B00', DEBT_INSTALLMENT: '#B4234A', INVOICE_DUE: '#475569',
};
const ALL_TYPES = Object.keys(TYPE_COLORS) as CalendarItemType[];
const ROUTES: Partial<Record<CalendarItemType, string>> = { BILL: '/financas/transacoes', RECURRING_BILL: '/financas/transacoes', DEBT_INSTALLMENT: '/financas/dividas', INVOICE_DUE: '/financas/cartoes' };
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const cut = (v: string | null) => (v ? v.slice(0, 5) : null);

type Dlg =
  | { kind: 'create'; date: string; start?: string; end?: string; allDay: boolean }
  | { kind: 'createTask' | 'createEvent'; date: string; start?: string; end?: string; allDay: boolean }
  | { kind: 'detail'; item: CalendarItem }
  | { kind: 'editTask'; task: Task; scope?: Scope; occurrence: string | null }
  | { kind: 'editEvent'; event: AgendaEvent; scope?: Scope; occurrence: string | null }
  | { kind: 'delete'; item: CalendarItem }
  | null;

export function CalendarPage() {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [types, setTypes] = useState<CalendarItemType[]>(ALL_TYPES);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [dlg, setDlg] = useState<Dlg>(null);
  const lookups = useLookups();
  const m = useAgendaMutations();
  const tx = useTransactionMutations();
  const toast = useToast();
  const { choose, dialog: scopeDialog } = useScopeChoice();

  const typesParam = types.length === ALL_TYPES.length ? '' : types.join(',');
  const query = useCalendarItems(range?.from ?? null, range?.to ?? null, typesParam, categoryId, status);
  const items = query.data ?? [];

  const events: FcEventInput[] = useMemo(() => items.map((i) => {
    const color = i.type === 'BILL' && i.direction === 'IN' ? '#14704A' : TYPE_COLORS[i.type];
    const allDay = i.allDay || !i.startTime;
    return {
      id: i.id, title: i.title, allDay,
      start: allDay ? i.date : `${i.date}T${i.startTime}`, end: allDay || !i.endTime ? undefined : `${i.date}T${i.endTime}`,
      editable: i.editable, backgroundColor: color, borderColor: i.conflict ? '#14202B' : color, extendedProps: { item: i },
      classNames: [i.done ? 'fc-done' : '', i.conflict ? 'fc-conflict' : ''].filter(Boolean),
    };
  }), [items]);

  const onDatesSet = (arg: DatesSetArg) => {
    const end = new Date(arg.end); end.setDate(end.getDate() - 1);
    setRange((r) => { const next = { from: toISODate(arg.start), to: toISODate(end) }; return r && r.from === next.from && r.to === next.to ? r : next; });
  };

  // ---------- arrastar e redimensionar (persistem no backend; em falha, desfaz) ----------
  const reschedule = async (info: EventDropArg | EventResizeDoneArg) => {
    const item = info.event.extendedProps.item as CalendarItem;
    const start = info.event.start;
    if (!start) { info.revert(); return; }
    const allDay = info.event.allDay;
    let end = info.event.end;
    if (item.type === 'EVENT' && !allDay && !end) end = new Date(start.getTime() + 60 * 60 * 1000);
    const body = { date: toISODate(start), startTime: allDay ? null : hhmm(start), endTime: allDay || !end ? null : hhmm(end) };
    const scope = item.recurring ? await choose('Mover qual(is) ocorrência(s)?') : undefined;
    if (item.recurring && !scope) { info.revert(); return; }
    try {
      if (item.type === 'TASK') await m.scheduleTask.mutateAsync({ id: item.sourceId, body, scope: scope ?? undefined, occurrence: item.occurrenceDate });
      else {
        const updated = await m.scheduleEvent.mutateAsync({ id: item.sourceId, body: { ...body, allDay }, scope: scope ?? undefined, occurrence: item.occurrenceDate });
        if (updated.hasConflict) toast.error('Compromisso movido. Atenção: há outro item no mesmo horário.');
        else toast.success('Compromisso reagendado.');
        return;
      }
      toast.success('Tarefa reagendada.');
    } catch (e) {
      info.revert();
      toast.error(`Não foi possível reagendar: ${errorMessage(e)}`);
    }
  };

  const toggleTask = async (item: CalendarItem) => {
    try { await m.taskStatus.mutateAsync({ id: item.sourceId, status: item.done ? 'PENDING' : 'DONE', occurrence: item.occurrenceDate }); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  const eventContent = (arg: EventContentArg) => {
    const item = arg.event.extendedProps.item as CalendarItem;
    return (
      <div className="fc-item" title={`${itemTypeLabels[item.type]}: ${item.title}`}>
        {item.type === 'TASK' && (
          <button type="button" className="fc-check" aria-label={`${item.done ? 'Reabrir' : 'Concluir'} ${item.title}`} onClick={(e) => { e.stopPropagation(); void toggleTask(item); }} onMouseDown={(e) => e.stopPropagation()}>
            {item.done ? <CheckSquare size={13} /> : <Square size={13} />}
          </button>
        )}
        {(item.conflict || (item.overdue && !item.done)) && <AlertTriangle size={12} aria-label={item.conflict ? 'Conflito de horário' : 'Atrasado'} />}
        <span className="fc-item-text">{arg.timeText ? `${arg.timeText} ` : ''}{item.title}{item.amount !== null ? ` · ${formatBRL(item.amount)}` : ''}</span>
      </div>
    );
  };

  // ---------- ações ----------
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); } catch (e) { toast.error(errorMessage(e)); } };

  const openEdit = async (item: CalendarItem) => {
    let scope: Scope | undefined;
    if (item.recurring) { const s = await choose('Editar qual(is) ocorrência(s)?'); if (!s) return; scope = s; }
    try {
      if (item.type === 'TASK') {
        const task = await taskService.get(item.sourceId);
        setDlg({ kind: 'editTask', task: scope && scope !== 'ALL' ? { ...task, date: item.occurrenceDate } : task, scope, occurrence: item.occurrenceDate });
      } else {
        const event = await eventService.get(item.sourceId);
        setDlg({ kind: 'editEvent', event: scope && scope !== 'ALL' ? { ...event, date: item.occurrenceDate ?? event.date } : event, scope, occurrence: item.occurrenceDate });
      }
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const askDelete = async (item: CalendarItem) => {
    if (item.recurring) {
      const scope = await choose('Excluir qual(is) ocorrência(s)?');
      if (!scope) return;
      const fn = item.type === 'TASK' ? () => m.removeTask.mutateAsync({ id: item.sourceId, scope, occurrence: item.occurrenceDate }) : () => m.removeEvent.mutateAsync({ id: item.sourceId, scope, occurrence: item.occurrenceDate });
      await run(fn, 'Excluído.'); setDlg(null);
    } else setDlg({ kind: 'delete', item });
  };

  const create = (kind: 'createTask' | 'createEvent') => dlg && 'date' in dlg && setDlg({ ...dlg, kind });
  const onSelect = (arg: DateSelectArg) => {
    const date = toISODate(arg.start);
    setDlg({ kind: 'create', date, allDay: arg.allDay, start: arg.allDay ? undefined : hhmm(arg.start), end: arg.allDay ? undefined : hhmm(arg.end) });
    calendarRef.current?.getApi().unselect();
  };

  const saveTask = async (input: TaskInput) => {
    if (dlg?.kind === 'editTask') await m.updateTask.mutateAsync({ id: dlg.task.id, input, scope: dlg.scope, occurrence: dlg.occurrence });
    else await m.createTask.mutateAsync(input);
    toast.success('Tarefa salva.'); setDlg(null);
  };
  const saveEvent = async (input: EventInput) => {
    const saved = dlg?.kind === 'editEvent' ? await m.updateEvent.mutateAsync({ id: dlg.event.id, input, scope: dlg.scope, occurrence: dlg.occurrence }) : await m.createEvent.mutateAsync(input);
    if (saved.hasConflict) toast.error('Evento salvo. Atenção: há outro compromisso no mesmo horário.'); else toast.success('Evento salvo.');
    setDlg(null);
  };

  const item = dlg?.kind === 'detail' ? dlg.item : null;

  return (
    <>
      <header className="page-header"><h1>Calendário</h1><p className="muted">Tarefas, eventos e vencimentos financeiros em um só lugar. Arraste para mover, puxe a borda para mudar a duração, clique num espaço vazio para criar.</p></header>

      <section className="card filters" aria-label="Filtros do calendário">
        <fieldset className="picker"><legend>Mostrar</legend>
          <div className="tag-checks">{ALL_TYPES.map((t) => (
            <label key={t} className="check"><input type="checkbox" checked={types.includes(t)} onChange={(e) => setTypes(e.target.checked ? [...types, t] : types.filter((x) => x !== t))} />
              <span className="type-dot" style={{ background: TYPE_COLORS[t] }} aria-hidden="true" /> {itemTypeLabels[t]}</label>
          ))}</div>
        </fieldset>
        <SelectField label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={[{ value: '', label: 'Todas' }, ...categoryOptions(lookups.categoryTree)]} />
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'Todos' }, { value: 'PENDING', label: 'Tarefa pendente' }, { value: 'DONE', label: 'Concluído/realizado' }, { value: 'PLANNED', label: 'Planejado' }, { value: 'OVERDUE', label: 'Em atraso (parcela/fatura)' }]} />
      </section>

      {query.isError && <InlineError message="Não foi possível carregar o calendário." onRetry={() => void query.refetch()} />}
      <div className="card calendar-card" aria-busy={query.isFetching}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={ptBrLocale}
          initialView="timeGridWeek"
          views={{ timeGridThreeDay: { type: 'timeGrid', duration: { days: 3 }, buttonText: '3 dias' } }}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek' }}
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', list: 'Lista' }}
          height="auto" nowIndicator selectable selectMirror editable eventDurationEditable eventStartEditable scrollTime="07:00:00" slotDuration="00:30:00"
          events={events} eventContent={eventContent} datesSet={onDatesSet} select={onSelect}
          eventClick={(arg: EventClickArg) => setDlg({ kind: 'detail', item: arg.event.extendedProps.item as CalendarItem })}
          eventDrop={(info) => void reschedule(info)} eventResize={(info) => void reschedule(info)}
        />
      </div>

      <Dialog open={dlg?.kind === 'create'} onClose={() => setDlg(null)} title="Criar no calendário">
        <p className="muted">O que você quer criar{dlg && 'date' in dlg ? ` em ${formatDate(dlg.date)}` : ''}?</p>
        <div className="dialog-actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={() => create('createTask')}>Tarefa</button>
          <button className="btn btn-primary" onClick={() => create('createEvent')}>Evento</button>
          <button className="btn" onClick={() => setDlg(null)}>Cancelar</button>
        </div>
      </Dialog>
      <Dialog open={dlg?.kind === 'createTask' || dlg?.kind === 'editTask'} onClose={() => setDlg(null)} title={dlg?.kind === 'editTask' ? 'Editar tarefa' : 'Nova tarefa'}>
        {(dlg?.kind === 'createTask' || dlg?.kind === 'editTask') && <TaskForm initial={dlg.kind === 'editTask' ? dlg.task : undefined} defaults={dlg.kind === 'createTask' ? { date: dlg.date, startTime: dlg.start, endTime: dlg.end } : undefined} onSubmit={saveTask} onCancel={() => setDlg(null)} />}
      </Dialog>
      <Dialog open={dlg?.kind === 'createEvent' || dlg?.kind === 'editEvent'} onClose={() => setDlg(null)} title={dlg?.kind === 'editEvent' ? 'Editar evento' : 'Novo evento'}>
        {(dlg?.kind === 'createEvent' || dlg?.kind === 'editEvent') && <EventForm initial={dlg.kind === 'editEvent' ? dlg.event : undefined} defaults={dlg.kind === 'createEvent' ? { date: dlg.date, startTime: dlg.start, endTime: dlg.end, allDay: dlg.allDay } : undefined} onSubmit={saveEvent} onCancel={() => setDlg(null)} />}
      </Dialog>

      <Dialog open={item !== null} onClose={() => setDlg(null)} title={item?.title ?? ''}>
        {item && (
          <div>
            <p className="muted">{itemTypeLabels[item.type]} · {formatDate(item.date)}{item.startTime ? ` · ${cut(item.startTime)}${item.endTime ? `–${cut(item.endTime)}` : ''}` : ''}{item.recurring ? ' · recorrente' : ''}</p>
            {item.amount !== null && <p><strong>{formatBRL(item.amount)}</strong> {item.direction === 'IN' ? 'a receber' : 'a pagar'}</p>}
            {item.location && <p>{item.location}</p>}
            {item.conflict && <p className="form-error" role="alert">Há outro compromisso no mesmo horário.</p>}
            <p>Status: <strong>{item.done ? 'Concluído' : item.overdue ? 'Em atraso' : item.status}</strong></p>
            <div className="dialog-actions" style={{ justifyContent: 'flex-start' }}>
              {item.type === 'TASK' && <button className="btn btn-primary" onClick={() => void toggleTask(item).then(() => setDlg(null))}>{item.done ? 'Reabrir' : 'Concluir'}</button>}
              {item.type === 'EVENT' && (['DONE', 'NOT_DONE', 'CANCELED', 'SCHEDULED'] as EventStatus[]).filter((s) => s !== item.status).map((s) => (
                <button key={s} className="btn" onClick={() => void run(() => m.eventStatus.mutateAsync({ id: item.sourceId, status: s, occurrence: item.occurrenceDate }), 'Status atualizado.').then(() => setDlg(null))}>{s === 'SCHEDULED' ? 'Reagendar' : `Marcar como ${eventStatusLabels[s].toLowerCase()}`}</button>
              ))}
              {item.type === 'BILL' && <button className="btn btn-primary" onClick={() => void run(() => tx.settle.mutateAsync({ id: item.sourceId, date: null }), 'Liquidada.').then(() => setDlg(null))}>Liquidar hoje</button>}
              {item.type === 'RECURRING_BILL' && !item.done && <button className="btn btn-primary" onClick={() => void run(() => m.settleRecurring.mutateAsync({ id: item.sourceId, occurrence: item.date, settledDate: null }), 'Ocorrência liquidada.').then(() => setDlg(null))}>Liquidar ocorrência</button>}
              {ROUTES[item.type] && <button className="btn" onClick={() => { setDlg(null); navigate(ROUTES[item.type]!); }}>Abrir no módulo</button>}
              {item.editable && <button className="btn" onClick={() => { setDlg(null); void openEdit(item); }}>Editar</button>}
              {item.editable && <button className="btn" onClick={() => void askDelete(item)}>Excluir</button>}
              <button className="btn" onClick={() => setDlg(null)}>Fechar</button>
            </div>
          </div>
        )}
      </Dialog>
      <ConfirmDialog open={dlg?.kind === 'delete'} destructive confirmLabel="Excluir" title="Excluir item?" message={<>Excluir <strong>{dlg?.kind === 'delete' ? dlg.item.title : ''}</strong>?</>}
        onCancel={() => setDlg(null)}
        onConfirm={() => { if (dlg?.kind !== 'delete') return; const it = dlg.item; void run(() => (it.type === 'TASK' ? m.removeTask.mutateAsync({ id: it.sourceId }) : m.removeEvent.mutateAsync({ id: it.sourceId })), 'Excluído.').then(() => setDlg(null)); }} />
      {scopeDialog}
    </>
  );
}

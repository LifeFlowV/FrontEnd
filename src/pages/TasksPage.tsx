import { AlertTriangle, CalendarClock, Copy, Flag, ListChecks, MapPin, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { Field, SelectField } from '../components/Field';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { EventForm, TaskForm } from '../features/agenda/AgendaForms';
import { useDebounced } from '../hooks/useDebounced';
import { categoryOptions, useLookups } from '../hooks/useLookups';
import { useAgendaMutations, useEvents, useTaskHistory, useTasks } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import { eventStatusLabels, priorityLabels, taskStatusLabels, type AgendaEvent, type EventInput, type EventStatus, type Task, type TaskInput, type TaskPriority, type TaskStatus } from '../types/agenda';
import { errorMessage } from '../utils/forms';
import { describeRecurrence, formatDate, toISODate } from '../utils/format';

type Tab = 'tasks' | 'events' | 'history';
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : '');

export function TasksPage() {
  const [tab, setTab] = useState<Tab>('tasks');
  return (
    <>
      <header className="page-header"><h1>Tarefas e eventos</h1><p className="muted">Tarefas com subtarefas e prioridade, eventos com horário. Tudo aparece também no Calendário.</p></header>
      <div className="tabs" role="tablist" aria-label="Tarefas e eventos">
        {([['tasks', 'Tarefas'], ['events', 'Eventos'], ['history', 'Histórico de conclusão']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className="tab" onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'tasks' ? <TasksPanel /> : tab === 'events' ? <EventsPanel /> : <HistoryPanel />}
      </div>
    </>
  );
}

type TaskDlg = { kind: 'new' } | { kind: 'sub'; parent: Task } | { kind: 'edit'; task: Task } | { kind: 'delete'; task: Task } | null;

function TasksPanel() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [dlg, setDlg] = useState<TaskDlg>(null);
  const q = useDebounced(search.trim());
  const query = useTasks({ status: status || undefined, priority: priority || undefined, categoryId: categoryId || undefined, q: q || undefined });
  const lookups = useLookups();
  const m = useAgendaMutations();
  const toast = useToast();
  const tasks = query.data ?? [];

  const run = async (fn: () => Promise<unknown>, ok?: string) => { try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(errorMessage(e)); } };
  const toggle = (t: Task) => run(() => m.taskStatus.mutateAsync({ id: t.id, status: t.status === 'DONE' ? 'PENDING' : 'DONE', occurrence: t.recurrence ? t.nextOccurrence : null }));

  const save = async (input: TaskInput) => {
    if (dlg?.kind === 'edit') { await m.updateTask.mutateAsync({ id: dlg.task.id, input, scope: dlg.task.recurrence ? 'ALL' : undefined }); toast.success('Tarefa atualizada.'); }
    else { await m.createTask.mutateAsync(input); toast.success(dlg?.kind === 'sub' ? 'Subtarefa adicionada.' : 'Tarefa criada.'); }
    setDlg(null);
  };

  const renderTask = (t: Task, sub = false) => {
    const done = t.status === 'DONE';
    return (
      <li key={t.id} className={`task-row${sub ? ' task-sub' : ''}`}>
        <label className="task-check">
          <input type="checkbox" checked={done} onChange={() => void toggle(t)} aria-label={`${done ? 'Reabrir' : 'Concluir'} ${t.title}${t.recurrence && t.nextOccurrence ? ` de ${formatDate(t.nextOccurrence)}` : ''}`} />
        </label>
        <div className="task-body">
          <div className={`cell-main${done || t.status === 'CANCELED' ? ' struck' : ''}`}>{t.title}</div>
          <div className="cell-flags">
            {!sub && <span className={`chip ${t.priority === 'URGENT' ? 'chip-expense' : ''}`}><Flag size={12} aria-hidden="true" /> {priorityLabels[t.priority as TaskPriority]}</span>}
            {t.status !== 'PENDING' && <span className="chip">{taskStatusLabels[t.status as TaskStatus]}</span>}
            {t.overdue && <span className="chip chip-expense"><AlertTriangle size={12} aria-hidden="true" /> Atrasada</span>}
            {t.date && <span className="chip"><CalendarClock size={12} aria-hidden="true" /> {formatDate(t.date)}{t.startTime ? ` · ${hhmm(t.startTime)}${t.endTime ? `–${hhmm(t.endTime)}` : ''}` : ''}</span>}
            {t.recurrence && <span className="chip"><Repeat size={12} aria-hidden="true" /> {describeRecurrence(t.recurrence)}{t.nextOccurrence ? ` · próxima ${formatDate(t.nextOccurrence)}` : ''}</span>}
            {t.categoryId && <span className="chip">{lookups.categoryNames.get(t.categoryId)}</span>}
            {t.tagIds.map((id) => <span key={id} className="chip">#{lookups.tags.find((x) => x.id === id)?.name}</span>)}
            {t.subtaskTotal > 0 && <span className="chip"><ListChecks size={12} aria-hidden="true" /> {t.subtaskDone}/{t.subtaskTotal}</span>}
          </div>
          {t.subtasks.length > 0 && <ul className="task-subs">{t.subtasks.map((s) => renderTask(s, true))}</ul>}
        </div>
        <div className="row-actions">
          {!sub && !t.recurrence && <button className="icon-btn" aria-label={`Adicionar subtarefa a ${t.title}`} title="Adicionar subtarefa" onClick={() => setDlg({ kind: 'sub', parent: t })}><Plus size={16} /></button>}
          <button className="icon-btn" aria-label={`Editar ${t.title}`} title="Editar" onClick={() => setDlg({ kind: 'edit', task: t })}><Pencil size={16} /></button>
          {!sub && <button className="icon-btn" aria-label={`Duplicar ${t.title}`} title="Duplicar" onClick={() => void run(() => m.duplicateTask.mutateAsync(t.id), 'Tarefa duplicada.')}><Copy size={16} /></button>}
          <button className="icon-btn" aria-label={`Excluir ${t.title}`} title="Excluir" onClick={() => setDlg({ kind: 'delete', task: t })}><Trash2 size={16} /></button>
        </div>
      </li>
    );
  };

  return (
    <>
      <div className="toolbar"><button className="btn btn-primary" onClick={() => setDlg({ kind: 'new' })}><Plus size={18} aria-hidden="true" /> Nova tarefa</button></div>
      <section className="card filters" aria-label="Filtros de tarefas">
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'Todos' }, ...(Object.keys(taskStatusLabels) as TaskStatus[]).map((s) => ({ value: s, label: taskStatusLabels[s] }))]} />
        <SelectField label="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: '', label: 'Todas' }, ...(Object.keys(priorityLabels) as TaskPriority[]).map((p) => ({ value: p, label: priorityLabels[p] }))]} />
        <SelectField label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={[{ value: '', label: 'Todas' }, ...categoryOptions(lookups.categoryTree)]} />
        <Field label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título da tarefa" />
      </section>
      {query.isLoading ? <InlineLoading label="Carregando tarefas…" /> : query.isError ? <InlineError message="Não foi possível carregar as tarefas." onRetry={() => void query.refetch()} /> : tasks.length === 0 ? (
        <div className="card"><EmptyState icon={<ListChecks size={22} />} title="Nenhuma tarefa"><p className="muted">Crie tarefas com data, prioridade e subtarefas.</p>
          <button className="btn btn-primary" onClick={() => setDlg({ kind: 'new' })}><Plus size={18} aria-hidden="true" /> Nova tarefa</button></EmptyState></div>
      ) : <ul className="card task-list">{tasks.map((t) => renderTask(t))}</ul>}
      <p className="muted small">Em tarefas recorrentes, o checkbox conclui a próxima ocorrência. Para alterar só uma ocorrência ou “esta e as próximas”, use o Calendário.</p>

      <Dialog open={dlg?.kind === 'new' || dlg?.kind === 'sub' || dlg?.kind === 'edit'} onClose={() => setDlg(null)} title={dlg?.kind === 'edit' ? 'Editar tarefa' : dlg?.kind === 'sub' ? 'Nova subtarefa' : 'Nova tarefa'}>
        {(dlg?.kind === 'new' || dlg?.kind === 'sub' || dlg?.kind === 'edit') && <TaskForm initial={dlg.kind === 'edit' ? dlg.task : undefined} parentTaskId={dlg.kind === 'sub' ? dlg.parent.id : null} onSubmit={save} onCancel={() => setDlg(null)} />}
      </Dialog>
      <ConfirmDialog open={dlg?.kind === 'delete'} destructive confirmLabel="Excluir" title="Excluir tarefa?" busy={m.removeTask.isPending}
        message={dlg?.kind === 'delete' ? (dlg.task.recurrence ? <>A série <strong>{dlg.task.title}</strong> deixa de existir daqui para frente. O que já foi concluído fica no histórico.</> : <>A tarefa <strong>{dlg.task.title}</strong>{dlg.task.subtaskTotal > 0 ? ' e suas subtarefas' : ''} será excluída.</>) : ''}
        onCancel={() => setDlg(null)} onConfirm={() => dlg?.kind === 'delete' && void run(() => m.removeTask.mutateAsync({ id: dlg.task.id, scope: dlg.task.recurrence ? 'ALL' : undefined }), 'Tarefa excluída.').then(() => setDlg(null))} />
    </>
  );
}

type EvDlg = { kind: 'new' } | { kind: 'edit'; event: AgendaEvent } | { kind: 'delete'; event: AgendaEvent } | null;

function EventsPanel() {
  const query = useEvents();
  const lookups = useLookups();
  const m = useAgendaMutations();
  const toast = useToast();
  const [dlg, setDlg] = useState<EvDlg>(null);
  const today = useMemo(() => toISODate(new Date()), []);
  const events = (query.data ?? []).filter((e) => e.recurrence !== null || e.date >= today);

  const run = async (fn: () => Promise<unknown>, ok?: string) => { try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(errorMessage(e)); } };
  const save = async (input: EventInput) => {
    if (dlg?.kind === 'edit') { await m.updateEvent.mutateAsync({ id: dlg.event.id, input, scope: dlg.event.recurrence ? 'ALL' : undefined }); toast.success('Evento atualizado.'); }
    else { const created = await m.createEvent.mutateAsync(input); toast.success(created.hasConflict ? 'Evento criado. Atenção: há outro compromisso no mesmo horário.' : 'Evento criado.'); }
    setDlg(null);
  };

  return (
    <>
      <div className="toolbar"><button className="btn btn-primary" onClick={() => setDlg({ kind: 'new' })}><Plus size={18} aria-hidden="true" /> Novo evento</button></div>
      {query.isLoading ? <InlineLoading label="Carregando eventos…" /> : query.isError ? <InlineError message="Não foi possível carregar os eventos." onRetry={() => void query.refetch()} /> : events.length === 0 ? (
        <div className="card"><EmptyState icon={<CalendarClock size={22} />} title="Nenhum evento futuro"><p className="muted">Eventos são compromissos com horário (ou dia inteiro).</p>
          <button className="btn btn-primary" onClick={() => setDlg({ kind: 'new' })}><Plus size={18} aria-hidden="true" /> Novo evento</button></EmptyState></div>
      ) : (
        <ul className="card task-list">
          {events.map((e) => (
            <li key={e.id} className="task-row">
              <div className="task-body">
                <div className="cell-main">{e.title}</div>
                <div className="cell-flags">
                  <span className="chip"><CalendarClock size={12} aria-hidden="true" /> {formatDate(e.date)} · {e.allDay ? 'Dia inteiro' : `${hhmm(e.startTime)}–${hhmm(e.endTime)}`}</span>
                  {e.location && <span className="chip"><MapPin size={12} aria-hidden="true" /> {e.location}</span>}
                  {e.recurrence && <span className="chip"><Repeat size={12} aria-hidden="true" /> {describeRecurrence(e.recurrence)}</span>}
                  {e.hasConflict && <span className="chip chip-expense"><AlertTriangle size={12} aria-hidden="true" /> Conflito de horário</span>}
                  {e.categoryId && <span className="chip">{lookups.categoryNames.get(e.categoryId)}</span>}
                  {!e.recurrence && e.status !== 'SCHEDULED' && <span className="chip">{eventStatusLabels[e.status]}</span>}
                </div>
              </div>
              {!e.recurrence && (
                <select className="mini-select" aria-label={`Status de ${e.title}`} value={e.status} onChange={(ev) => void run(() => m.eventStatus.mutateAsync({ id: e.id, status: ev.target.value as EventStatus }))}>
                  {(Object.keys(eventStatusLabels) as EventStatus[]).map((s) => <option key={s} value={s}>{eventStatusLabels[s]}</option>)}
                </select>
              )}
              <div className="row-actions">
                <button className="icon-btn" aria-label={`Editar ${e.title}`} title="Editar" onClick={() => setDlg({ kind: 'edit', event: e })}><Pencil size={16} /></button>
                <button className="icon-btn" aria-label={`Duplicar ${e.title}`} title="Duplicar" onClick={() => void run(() => m.duplicateEvent.mutateAsync(e.id), 'Evento duplicado.')}><Copy size={16} /></button>
                <button className="icon-btn" aria-label={`Excluir ${e.title}`} title="Excluir" onClick={() => setDlg({ kind: 'delete', event: e })}><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">Para marcar uma ocorrência de evento recorrente como realizada ou editar só uma ocorrência, use o Calendário.</p>
      <Dialog open={dlg?.kind === 'new' || dlg?.kind === 'edit'} onClose={() => setDlg(null)} title={dlg?.kind === 'edit' ? 'Editar evento' : 'Novo evento'}>
        {(dlg?.kind === 'new' || dlg?.kind === 'edit') && <EventForm initial={dlg.kind === 'edit' ? dlg.event : undefined} onSubmit={save} onCancel={() => setDlg(null)} />}
      </Dialog>
      <ConfirmDialog open={dlg?.kind === 'delete'} destructive confirmLabel="Excluir" title="Excluir evento?" busy={m.removeEvent.isPending}
        message={dlg?.kind === 'delete' ? (dlg.event.recurrence ? <>A série <strong>{dlg.event.title}</strong> deixa de existir daqui para frente; as ocorrências passadas permanecem.</> : <>O evento <strong>{dlg.event.title}</strong> será excluído.</>) : ''}
        onCancel={() => setDlg(null)} onConfirm={() => dlg?.kind === 'delete' && void run(() => m.removeEvent.mutateAsync({ id: dlg.event.id, scope: dlg.event.recurrence ? 'ALL' : undefined }), 'Evento excluído.').then(() => setDlg(null))} />
    </>
  );
}

function HistoryPanel() {
  const range = useMemo(() => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 30); return { from: toISODate(from), to: toISODate(to) }; }, []);
  const query = useTaskHistory(range.from, range.to);
  if (query.isLoading) return <InlineLoading label="Carregando histórico…" />;
  if (query.isError) return <InlineError message="Não foi possível carregar o histórico." onRetry={() => void query.refetch()} />;
  const rows = query.data ?? [];
  return rows.length === 0 ? <div className="card"><EmptyState icon={<ListChecks size={22} />} title="Nada concluído nos últimos 30 dias" /></div> : (
    <ul className="card list">
      {rows.map((h, i) => (
        <li key={`${h.taskId}-${i}`} className="list-row">
          <span className="list-main">{h.title}{h.occurrenceDate ? <span className="muted small"> (ocorrência de {formatDate(h.occurrenceDate)})</span> : null}</span>
          <span className="muted small">Concluída em {new Date(h.completedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        </li>
      ))}
    </ul>
  );
}

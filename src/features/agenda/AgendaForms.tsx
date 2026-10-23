import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { categoryOptions, useLookups } from '../../hooks/useLookups';
import { priorityLabels, taskStatusLabels, type AgendaEvent, type EventInput, type RecurrenceInput, type Task, type TaskInput, type TaskPriority, type TaskStatus } from '../../types/agenda';
import { applyApiError } from '../../utils/forms';
import { todayISO } from '../../utils/format';
import { RecurrenceFields } from './RecurrenceFields';

const times = (d: { startTime: string; endTime: string }) => !d.startTime || !d.endTime || d.endTime > d.startTime;
const hhmm = (v: string | null | undefined) => (v ? v.slice(0, 5) : '');
const recToInput = (r: Task['recurrence'] | AgendaEvent['recurrence']): RecurrenceInput | null =>
  r ? { frequency: r.frequency, interval: r.interval, weekdays: r.weekdays, monthMode: r.monthMode, monthDay: r.monthDay, until: r.until } : null;

function TagChecks({ register }: { register: ReturnType<typeof useForm<{ tagIds: string[] }>>['register'] }) {
  const { tags } = useLookups();
  if (tags.length === 0) return null;
  return (
    <fieldset className="picker"><legend>Etiquetas</legend>
      <div className="tag-checks">{tags.map((t) => <label key={t.id} className="check"><input type="checkbox" value={t.id} {...register('tagIds')} /> {t.name}</label>)}</div>
    </fieldset>
  );
}

// ---------------- Tarefa ----------------
const taskSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(160, 'Máximo de 160 caracteres.'),
  description: z.string().max(1000, 'Máximo de 1000 caracteres.'),
  date: z.string(), startTime: z.string(), endTime: z.string(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']), status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELED']),
  categoryId: z.string(), notes: z.string().max(500, 'Máximo de 500 caracteres.'), tagIds: z.array(z.string()),
}).refine(times, { path: ['endTime'], message: 'O horário final deve ser depois do inicial.' })
  .refine((d) => !(d.startTime || d.endTime) || d.date, { path: ['date'], message: 'Informe a data para usar horários.' });
type TaskData = z.infer<typeof taskSchema>;

export function TaskForm({ initial, defaults, parentTaskId, onSubmit, onCancel }: {
  initial?: Task; defaults?: { date?: string; startTime?: string; endTime?: string }; parentTaskId?: string | null;
  onSubmit: (i: TaskInput) => Promise<void>; onCancel: () => void;
}) {
  const { categoryTree } = useLookups();
  const [formError, setFormError] = useState<string>();
  const [recurrence, setRecurrence] = useState<RecurrenceInput | null>(recToInput(initial?.recurrence ?? null));
  const isSub = !!(parentTaskId ?? initial?.parentTaskId);
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<TaskData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: initial?.title ?? '', description: initial?.description ?? '', date: initial?.date ?? defaults?.date ?? '', startTime: hhmm(initial?.startTime ?? defaults?.startTime),
      endTime: hhmm(initial?.endTime ?? defaults?.endTime), priority: initial?.priority ?? 'NORMAL', status: initial?.status ?? 'PENDING', categoryId: initial?.categoryId ?? '', notes: initial?.notes ?? '', tagIds: initial?.tagIds ?? [] },
  });
  const date = watch('date');

  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({ title: d.title, description: d.description.trim() || null, date: d.date || null, startTime: d.startTime || null, endTime: d.endTime || null,
        priority: d.priority as TaskPriority, status: initial?.recurrence ? undefined : (d.status as TaskStatus), categoryId: d.categoryId || null, notes: d.notes.trim() || null,
        tagIds: d.tagIds, parentTaskId: parentTaskId ?? initial?.parentTaskId ?? null, recurrence: isSub ? null : recurrence });
    } catch (e) { setFormError(applyApiError(e, setError, ['title', 'description', 'date', 'startTime', 'endTime', 'priority', 'categoryId', 'notes'])); }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Field label={isSub ? 'Subtarefa' : 'Título'} autoFocus error={errors.title?.message} {...register('title')} />
      {!isSub && <Field label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />}
      <div className="form-row">
        <Field label="Data (opcional)" type="date" error={errors.date?.message} {...register('date')} />
        <SelectField label="Prioridade" options={(Object.keys(priorityLabels) as TaskPriority[]).map((p) => ({ value: p, label: priorityLabels[p] }))} {...register('priority')} />
      </div>
      <div className="form-row">
        <Field label="Início (opcional)" type="time" error={errors.startTime?.message} {...register('startTime')} />
        <Field label="Fim (opcional)" type="time" error={errors.endTime?.message} {...register('endTime')} />
      </div>
      {!initial?.recurrence && <SelectField label="Status" options={(Object.keys(taskStatusLabels) as TaskStatus[]).map((s) => ({ value: s, label: taskStatusLabels[s] }))} {...register('status')} />}
      {!isSub && <SelectField label="Categoria" options={[{ value: '', label: 'Sem categoria' }, ...categoryOptions(categoryTree)]} {...register('categoryId')} />}
      {!isSub && <TagChecks register={register as never} />}
      {!isSub && <RecurrenceFields value={recurrence} onChange={setRecurrence} startDate={date} />}
      {!isSub && recurrence && !date && <p className="field-error">Escolha a data inicial para repetir.</p>}
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

// ---------------- Evento ----------------
const eventSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(160, 'Máximo de 160 caracteres.'),
  description: z.string().max(1000, 'Máximo de 1000 caracteres.'),
  date: z.string().min(1, 'Informe a data.'), allDay: z.boolean(), startTime: z.string(), endTime: z.string(),
  location: z.string().max(160, 'Máximo de 160 caracteres.'), categoryId: z.string(), notes: z.string().max(500, 'Máximo de 500 caracteres.'), tagIds: z.array(z.string()),
}).refine((d) => d.allDay || (d.startTime && d.endTime), { path: ['startTime'], message: 'Informe início e fim, ou marque dia inteiro.' })
  .refine((d) => d.allDay || !d.startTime || !d.endTime || d.endTime > d.startTime, { path: ['endTime'], message: 'O horário final deve ser depois do inicial.' });
type EventData = z.infer<typeof eventSchema>;

export function EventForm({ initial, defaults, onSubmit, onCancel }: {
  initial?: AgendaEvent; defaults?: { date?: string; startTime?: string; endTime?: string; allDay?: boolean };
  onSubmit: (i: EventInput) => Promise<void>; onCancel: () => void;
}) {
  const { categoryTree } = useLookups();
  const [formError, setFormError] = useState<string>();
  const [recurrence, setRecurrence] = useState<RecurrenceInput | null>(recToInput(initial?.recurrence ?? null));
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<EventData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: initial?.title ?? '', description: initial?.description ?? '', date: initial?.date ?? defaults?.date ?? todayISO(), allDay: initial?.allDay ?? defaults?.allDay ?? false,
      startTime: hhmm(initial?.startTime ?? defaults?.startTime ?? '09:00'), endTime: hhmm(initial?.endTime ?? defaults?.endTime ?? '10:00'), location: initial?.location ?? '',
      categoryId: initial?.categoryId ?? '', notes: initial?.notes ?? '', tagIds: initial?.tagIds ?? [] },
  });
  const allDay = watch('allDay');
  const date = watch('date');

  const submit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await onSubmit({ title: d.title, description: d.description.trim() || null, date: d.date, startTime: d.allDay ? null : d.startTime || null, endTime: d.allDay ? null : d.endTime || null,
        allDay: d.allDay, location: d.location.trim() || null, categoryId: d.categoryId || null, notes: d.notes.trim() || null, tagIds: d.tagIds, recurrence });
    } catch (e) { setFormError(applyApiError(e, setError, ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'categoryId', 'notes'])); }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Field label="Título" autoFocus error={errors.title?.message} {...register('title')} />
      <Field label="Data" type="date" error={errors.date?.message} {...register('date')} />
      <label className="check form-check"><input type="checkbox" {...register('allDay')} /> Dia inteiro</label>
      {!allDay && (
        <div className="form-row">
          <Field label="Início" type="time" error={errors.startTime?.message} {...register('startTime')} />
          <Field label="Fim" type="time" error={errors.endTime?.message} {...register('endTime')} />
        </div>
      )}
      <Field label="Local (opcional)" error={errors.location?.message} {...register('location')} />
      <Field label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />
      <SelectField label="Categoria" options={[{ value: '', label: 'Sem categoria' }, ...categoryOptions(categoryTree)]} {...register('categoryId')} />
      <TagChecks register={register as never} />
      <RecurrenceFields value={recurrence} onChange={setRecurrence} startDate={date} />
      <Field label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} />
      <p className="muted small">Se houver outro compromisso no mesmo horário, você será avisado, mas pode manter os dois.</p>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

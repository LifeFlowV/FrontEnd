import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, SelectField } from '../../components/Field';
import { ColorPicker, IconPicker } from '../../components/Pickers';
import { categoryTypeLabels, categoryTypes, type Category, type CategoryInput } from '../../types/category';
import { applyApiError } from '../../utils/forms';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da categoria.').max(80, 'O nome deve ter no máximo 80 caracteres.'),
  description: z.string().trim().max(255, 'A descrição deve ter no máximo 255 caracteres.'),
  type: z.enum(categoryTypes),
  color: z.string().nullable(),
  icon: z.string().nullable(),
});
type FormData = z.infer<typeof schema>;

export type CategoryFormMode =
  | { kind: 'create-root' }
  | { kind: 'create-child'; parent: Category }
  | { kind: 'edit'; category: Category; parent?: Category };

const typeOptions = categoryTypes.map((t) => ({ value: t, label: categoryTypeLabels[t] }));

export function CategoryForm({ mode, onSubmit, onCancel }: { mode: CategoryFormMode; onSubmit: (input: CategoryInput) => Promise<void>; onCancel: () => void }) {
  const [formError, setFormError] = useState<string>();
  const initial = mode.kind === 'edit' ? mode.category : undefined;
  const parent = mode.kind === 'create-child' ? mode.parent : mode.kind === 'edit' ? mode.parent : undefined;

  const { register, control, watch, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      type: initial?.type ?? parent?.type ?? 'EXPENSE',
      color: initial?.color ?? null,
      icon: initial?.icon ?? null,
    },
  });
  const color = watch('color');

  const submit = handleSubmit(async (data) => {
    setFormError(undefined);
    try {
      await onSubmit({
        name: data.name,
        description: data.description || null,
        type: parent ? undefined : data.type,
        parentId: mode.kind === 'create-child' ? mode.parent.id : undefined,
        color: data.color,
        icon: data.icon,
      });
    } catch (error) {
      setFormError(applyApiError(error, setError, ['name', 'description', 'type', 'color', 'icon']));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      {parent && <p className="muted">Subcategoria de <strong>{parent.name}</strong>. O tipo ({categoryTypeLabels[parent.type]}) é herdado da categoria principal.</p>}
      <Field label="Nome" autoFocus error={errors.name?.message} {...register('name')} />
      <Field label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />
      {!parent && (
        <SelectField label="Tipo" options={typeOptions} hint="Define onde a categoria pode ser usada." error={errors.type?.message} {...register('type')} />
      )}
      <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
      <Controller control={control} name="icon" render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} color={color} />} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : initial ? 'Salvar alterações' : 'Criar categoria'}</button>
      </div>
    </form>
  );
}

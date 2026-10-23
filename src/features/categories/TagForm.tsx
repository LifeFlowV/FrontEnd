import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field } from '../../components/Field';
import { ColorPicker } from '../../components/Pickers';
import type { Tag, TagInput } from '../../types/category';
import { applyApiError } from '../../utils/forms';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da etiqueta.').max(40, 'O nome deve ter no máximo 40 caracteres.'),
  color: z.string().nullable(),
});
type FormData = z.infer<typeof schema>;

export function TagForm({ initial, onSubmit, onCancel }: { initial?: Tag; onSubmit: (input: TagInput) => Promise<void>; onCancel: () => void }) {
  const [formError, setFormError] = useState<string>();
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initial?.name ?? '', color: initial?.color ?? null },
  });

  const submit = handleSubmit(async (data) => {
    setFormError(undefined);
    try {
      await onSubmit(data);
    } catch (error) {
      setFormError(applyApiError(error, setError, ['name', 'color']));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Field label="Nome" autoFocus error={errors.name?.message} {...register('name')} />
      <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : initial ? 'Salvar alterações' : 'Criar etiqueta'}</button>
      </div>
    </form>
  );
}

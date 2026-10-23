import { Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '../../components/Dialog';
import { EmptyState, InlineError, InlineLoading } from '../../components/ScreenMessage';
import { useTagMutations, useTags } from '../../hooks/useResources';
import { useToast } from '../../hooks/useToast';
import type { Tag, TagInput } from '../../types/category';
import { errorMessage } from '../../utils/forms';
import { NEUTRAL_COLOR } from '../../utils/palette';
import { TagForm } from './TagForm';

type FormState = { mode: 'create' } | { mode: 'edit'; tag: Tag } | null;

export function TagsPanel() {
  const query = useTags();
  const { create, update, remove } = useTagMutations();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Tag | null>(null);

  const save = async (input: TagInput) => {
    if (form?.mode === 'edit') {
      await update.mutateAsync({ id: form.tag.id, input });
      toast.success('Etiqueta atualizada.');
    } else {
      await create.mutateAsync(input);
      toast.success('Etiqueta criada.');
    }
    setForm(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Etiqueta excluída.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setToDelete(null);
    }
  };

  const tags = query.data ?? [];

  return (
    <>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}><Plus size={18} aria-hidden="true" /> Nova etiqueta</button>
      </div>

      {query.isLoading ? (
        <InlineLoading label="Carregando etiquetas…" />
      ) : query.isError ? (
        <InlineError message="Não foi possível carregar as etiquetas." onRetry={() => void query.refetch()} />
      ) : tags.length === 0 ? (
        <div className="card">
          <EmptyState icon={<TagIcon size={22} />} title="Nenhuma etiqueta">
            <p className="muted">Etiquetas são livres e independentes das categorias. Use para marcar transações e tarefas (urgente, trabalho, viagem…).</p>
          </EmptyState>
        </div>
      ) : (
        <ul className="card list">
          {tags.map((t) => (
            <li key={t.id} className="list-row">
              <span className="tag-dot" style={{ background: t.color ?? NEUTRAL_COLOR }} aria-hidden="true" />
              <span className="list-main">{t.name}</span>
              <button className="icon-btn" aria-label={`Editar etiqueta ${t.name}`} title="Editar" onClick={() => setForm({ mode: 'edit', tag: t })}><Pencil size={17} /></button>
              <button className="icon-btn" aria-label={`Excluir etiqueta ${t.name}`} title="Excluir" onClick={() => setToDelete(t)}><Trash2 size={17} /></button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={form !== null} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Editar etiqueta' : 'Nova etiqueta'}>
        {form && <TagForm initial={form.mode === 'edit' ? form.tag : undefined} onSubmit={save} onCancel={() => setForm(null)} />}
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir etiqueta?"
        message={<>A etiqueta <strong>{toDelete?.name}</strong> será removida. Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

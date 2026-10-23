import { Eye, EyeOff, Pencil, Plus, RotateCcw, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { EmptyState, InlineError, InlineLoading } from '../components/ScreenMessage';
import { CategoryIcon, InactiveChip, TypeChip } from '../features/categories/CategoryBadge';
import { CategoryForm, type CategoryFormMode } from '../features/categories/CategoryForm';
import { TagsPanel } from '../features/categories/TagsPanel';
import { useCategoryMutations, useCategoryTree } from '../hooks/useResources';
import { useToast } from '../hooks/useToast';
import type { Category, CategoryInput } from '../types/category';
import { errorMessage } from '../utils/forms';

type Tab = 'categories' | 'tags';

export function CategoriesPage() {
  const [tab, setTab] = useState<Tab>('categories');
  return (
    <>
      <header className="page-header">
        <h1>Categorias e etiquetas</h1>
        <p className="muted">Organize receitas e despesas por categoria e subcategoria, e marque registros com etiquetas livres.</p>
      </header>
      <div className="tabs" role="tablist" aria-label="Categorias e etiquetas">
        <button role="tab" id="tab-categories" aria-selected={tab === 'categories'} aria-controls="panel-categories" className="tab" onClick={() => setTab('categories')}>Categorias</button>
        <button role="tab" id="tab-tags" aria-selected={tab === 'tags'} aria-controls="panel-tags" className="tab" onClick={() => setTab('tags')}>Etiquetas</button>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'categories' ? <CategoriesPanel /> : <TagsPanel />}
      </div>
    </>
  );
}

function CategoriesPanel() {
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState<CategoryFormMode | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const query = useCategoryTree(showInactive);
  const { create, update, setActive, remove, restoreDefaults } = useCategoryMutations();
  const toast = useToast();

  const save = async (input: CategoryInput) => {
    if (form?.kind === 'edit') {
      await update.mutateAsync({ id: form.category.id, input });
      toast.success('Categoria atualizada.');
    } else {
      await create.mutateAsync(input);
      toast.success('Categoria criada.');
    }
    setForm(null);
  };

  const toggleActive = async (category: Category) => {
    try {
      await setActive.mutateAsync({ id: category.id, active: !category.active });
      toast.success(category.active ? 'Categoria desativada.' : 'Categoria reativada.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Categoria excluída.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setToDelete(null);
    }
  };

  const doRestore = async () => {
    try {
      const { created } = await restoreDefaults.mutateAsync();
      toast.success(created === 0 ? 'Todas as categorias padrão já existem.' : `${created} categoria(s) padrão restaurada(s).`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setConfirmRestore(false);
    }
  };

  const roots = query.data ?? [];

  const actions = (c: Category, parent?: Category) => (
    <div className="row-actions">
      {!parent && c.active && (
        <button className="icon-btn" aria-label={`Nova subcategoria em ${c.name}`} title="Nova subcategoria" onClick={() => setForm({ kind: 'create-child', parent: c })}><Plus size={17} /></button>
      )}
      <button className="icon-btn" aria-label={`Editar ${c.name}`} title="Editar" onClick={() => setForm({ kind: 'edit', category: c, parent })}><Pencil size={17} /></button>
      <button className="icon-btn" aria-label={`${c.active ? 'Desativar' : 'Reativar'} ${c.name}`} title={c.active ? 'Desativar' : 'Reativar'} onClick={() => void toggleActive(c)}>
        {c.active ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
      <button className="icon-btn" aria-label={`Excluir ${c.name}`} title="Excluir" onClick={() => setToDelete(c)}><Trash2 size={17} /></button>
    </div>
  );

  return (
    <>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setForm({ kind: 'create-root' })}><Plus size={18} aria-hidden="true" /> Nova categoria</button>
        <button className="btn" onClick={() => setConfirmRestore(true)}><RotateCcw size={16} aria-hidden="true" /> Restaurar categorias padrão</button>
        <label className="check">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Mostrar inativas
        </label>
      </div>

      {query.isLoading ? (
        <InlineLoading label="Carregando categorias…" />
      ) : query.isError ? (
        <InlineError message="Não foi possível carregar as categorias." onRetry={() => void query.refetch()} />
      ) : roots.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Tags size={22} />} title="Nenhuma categoria">
            <p className="muted">Crie a sua primeira categoria ou restaure o conjunto padrão (Moradia, Alimentação, Transporte…).</p>
            <button className="btn btn-primary" onClick={() => void doRestore()}>Restaurar categorias padrão</button>
          </EmptyState>
        </div>
      ) : (
        <ul className="tree">
          {roots.map((c) => (
            <li key={c.id} className={`card tree-group${c.active ? '' : ' is-archived'}`}>
              <div className="tree-head">
                <CategoryIcon color={c.color} icon={c.icon} />
                <div className="list-main">
                  <h2>{c.name}</h2>
                  {c.description && <p className="muted small">{c.description}</p>}
                </div>
                <TypeChip type={c.type} />
                {!c.active && <InactiveChip />}
                {actions(c)}
              </div>
              {c.children.length > 0 && (
                <ul className="tree-children">
                  {c.children.map((k) => (
                    <li key={k.id} className={`list-row${k.active ? '' : ' is-archived'}`}>
                      <CategoryIcon color={k.color ?? c.color} icon={k.icon} size={26} />
                      <span className="list-main">{k.name}</span>
                      {!k.active && <InactiveChip />}
                      {actions(k, c)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.kind === 'edit' ? 'Editar categoria' : form?.kind === 'create-child' ? 'Nova subcategoria' : 'Nova categoria'}
      >
        {form && <CategoryForm mode={form} onSubmit={save} onCancel={() => setForm(null)} />}
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir categoria?"
        message={<>A categoria <strong>{toDelete?.name}</strong> será removida. Categorias com subcategorias não podem ser excluídas. Para só escondê-la, use Desativar.</>}
        confirmLabel="Excluir"
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmRestore}
        title="Restaurar categorias padrão?"
        message="Serão criadas apenas as categorias e subcategorias padrão que não existem mais. As que você já tem, editadas ou não, não são alteradas."
        confirmLabel="Restaurar"
        busy={restoreDefaults.isPending}
        onConfirm={() => void doRestore()}
        onCancel={() => setConfirmRestore(false)}
      />
    </>
  );
}

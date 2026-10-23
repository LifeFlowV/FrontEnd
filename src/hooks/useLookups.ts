import { useMemo } from 'react';
import type { Category, CategoryType } from '../types/category';
import { useAccounts, useCategoryTree, usePaymentMethods, useTags } from './useResources';

export interface Option { value: string; label: string }

/** Lista plana "Categoria › Subcategoria", opcionalmente só as compatíveis com o tipo informado. */
export function categoryOptions(tree: Category[], type?: 'INCOME' | 'EXPENSE'): Option[] {
  const compatible = (t: CategoryType) => !type || t === 'BOTH' || t === type;
  const out: Option[] = [];
  tree.filter((c) => c.active && compatible(c.type)).forEach((c) => {
    out.push({ value: c.id, label: c.name });
    c.children.filter((k) => k.active).forEach((k) => out.push({ value: k.id, label: `${c.name} › ${k.name}` }));
  });
  return out;
}

/** Dados de apoio (contas, categorias, formas de pagamento, etiquetas) para filtros e formulários. */
export function useLookups() {
  const accounts = useAccounts(false);
  const categories = useCategoryTree(true);
  const methods = usePaymentMethods(false);
  const tags = useTags();

  return useMemo(() => {
    const tree = categories.data ?? [];
    const names = new Map<string, string>();
    tree.forEach((c) => { names.set(c.id, c.name); c.children.forEach((k) => names.set(k.id, `${c.name} › ${k.name}`)); });
    return {
      isLoading: accounts.isLoading || categories.isLoading || methods.isLoading || tags.isLoading,
      isError: accounts.isError || categories.isError || methods.isError || tags.isError,
      accounts: accounts.data ?? [],
      categoryTree: tree,
      categoryNames: names,
      methods: methods.data ?? [],
      tags: tags.data ?? [],
    };
  }, [accounts.data, accounts.isLoading, accounts.isError, categories.data, categories.isLoading, categories.isError, methods.data, methods.isLoading, methods.isError, tags.data, tags.isLoading, tags.isError]);
}

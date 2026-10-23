export const categoryTypes = ['EXPENSE', 'INCOME', 'BOTH'] as const;
export type CategoryType = (typeof categoryTypes)[number];

export const categoryTypeLabels: Record<CategoryType, string> = {
  EXPENSE: 'Despesa',
  INCOME: 'Receita',
  BOTH: 'Receita e despesa',
};

export interface Category {
  id: string;
  name: string;
  description: string | null;
  type: CategoryType;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  active: boolean;
  children: Category[];
}

export interface CategoryInput {
  name: string;
  description: string | null;
  type?: CategoryType;
  parentId?: string;
  color: string | null;
  icon: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface TagInput {
  name: string;
  color: string | null;
}

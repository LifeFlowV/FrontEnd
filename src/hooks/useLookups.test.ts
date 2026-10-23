import { describe, expect, it } from 'vitest';
import type { Category } from '../types/category';
import { categoryOptions } from './useLookups';

const cat = (id: string, name: string, type: Category['type'], children: Category[] = [], active = true): Category =>
  ({ id, name, description: null, type, parentId: null, color: null, icon: null, active, children });

describe('categoryOptions', () => {
  const tree = [cat('1', 'Moradia', 'EXPENSE', [cat('1a', 'Aluguel', 'EXPENSE'), cat('1b', 'Antiga', 'EXPENSE', [], false)]), cat('2', 'Renda', 'INCOME', [cat('2a', 'Salário', 'INCOME')]), cat('3', 'Outros', 'BOTH')];

  it('lista só categorias compatíveis com despesa, com o caminho Categoria › Subcategoria', () => {
    expect(categoryOptions(tree, 'EXPENSE').map((o) => o.label)).toEqual(['Moradia', 'Moradia › Aluguel', 'Outros']);
  });
  it('lista só categorias compatíveis com receita', () => {
    expect(categoryOptions(tree, 'INCOME').map((o) => o.label)).toEqual(['Renda', 'Renda › Salário', 'Outros']);
  });
  it('ignora inativas e sem filtro mostra todas as ativas', () => {
    expect(categoryOptions(tree).map((o) => o.label)).not.toContain('Moradia › Antiga');
    expect(categoryOptions(tree)).toHaveLength(5);
  });
});

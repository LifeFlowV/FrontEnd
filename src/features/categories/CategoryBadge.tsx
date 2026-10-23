import { EyeOff, ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import { categoryTypeLabels, type CategoryType } from '../../types/category';
import { iconFor } from '../../utils/icons';
import { NEUTRAL_COLOR } from '../../utils/palette';

export function CategoryIcon({ color, icon, size = 36 }: { color: string | null; icon: string | null; size?: number }) {
  const Icon = iconFor(icon);
  return (
    <span className="cat-icon" style={{ background: color ?? NEUTRAL_COLOR, width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}

const typeIcons = { INCOME: TrendingUp, EXPENSE: TrendingDown, BOTH: ArrowLeftRight } as const;

export function TypeChip({ type }: { type: CategoryType }) {
  const Icon = typeIcons[type];
  return <span className={`chip chip-${type.toLowerCase()}`}><Icon size={13} aria-hidden="true" /> {categoryTypeLabels[type]}</span>;
}

export function InactiveChip() {
  return <span className="chip"><EyeOff size={13} aria-hidden="true" /> Inativa</span>;
}

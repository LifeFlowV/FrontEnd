import { Ban } from 'lucide-react';
import { useId } from 'react';
import { categoryIcons } from '../utils/icons';
import { NEUTRAL_COLOR, swatches } from '../utils/palette';

interface PickerProps { value: string | null; onChange: (value: string | null) => void }

export function ColorPicker({ value, onChange }: PickerProps) {
  const name = useId();
  return (
    <fieldset className="picker">
      <legend>Cor</legend>
      <div className="picker-options">
        <label className="swatch" title="Sem cor">
          <input type="radio" name={name} checked={value === null} onChange={() => onChange(null)} />
          <span className="swatch-face" style={{ background: NEUTRAL_COLOR }}><Ban size={14} aria-hidden="true" /></span>
          <span className="sr-only">Sem cor</span>
        </label>
        {swatches.map((s) => (
          <label key={s.value} className="swatch" title={s.name}>
            <input type="radio" name={name} checked={value === s.value} onChange={() => onChange(s.value)} />
            <span className="swatch-face" style={{ background: s.value }} />
            <span className="sr-only">{s.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function IconPicker({ value, onChange, color }: PickerProps & { color: string | null }) {
  const name = useId();
  return (
    <fieldset className="picker">
      <legend>Ícone</legend>
      <div className="picker-options">
        {Object.entries(categoryIcons).map(([key, { icon: Icon, name: label }]) => (
          <label key={key} className="swatch" title={label}>
            <input type="radio" name={name} checked={value === key} onChange={() => onChange(key)} />
            <span className="swatch-face icon-face" style={value === key ? { background: color ?? NEUTRAL_COLOR, color: '#fff' } : undefined}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="sr-only">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

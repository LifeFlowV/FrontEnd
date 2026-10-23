import { useState, type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { todayISO } from '../utils/format';

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  dateLabel: string;
  confirmLabel: string;
  busy?: boolean;
  min?: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

/** Confirmação com escolha de data (liquidar, estornar). */
export function DateDialog({ open, title, message, dateLabel, confirmLabel, busy, min, onConfirm, onCancel }: Props) {
  const [date, setDate] = useState(todayISO());
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <div className="muted">{message}</div>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="date-dialog-input">{dateLabel}</label>
        <input id="date-dialog-input" type="date" value={date} min={min} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={() => onConfirm(date)} disabled={busy || !date}>{busy ? 'Aguarde…' : confirmLabel}</button>
      </div>
    </Dialog>
  );
}

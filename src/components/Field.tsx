import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

function Message({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) return <p id={`${id}-error`} className="field-error">{error}</p>;
  if (hint) return <p id={`${id}-hint`} className="field-hint">{hint}</p>;
  return null;
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, ...props }, ref) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={ref} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props} />
      <Message id={id} error={error} hint={hint} />
    </div>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField({ label, error, hint, options, ...props }, ref) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} ref={ref} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Message id={id} error={error} hint={hint} />
    </div>
  );
});

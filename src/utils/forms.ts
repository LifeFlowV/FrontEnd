import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../services/api';

/** Aplica erros por campo vindos da API ao formulário. Retorna uma mensagem geral quando nada pôde ser associado a um campo. */
export function applyApiError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: Path<T>[]): string | undefined {
  if (!(error instanceof ApiError)) return 'Algo deu errado. Tente novamente.';
  const fieldErrors = error.fieldErrors ?? {};
  let mapped = false;
  fields.forEach((field) => {
    const message = fieldErrors[field as string];
    if (message) {
      setError(field, { message });
      mapped = true;
    }
  });
  return mapped ? undefined : error.message;
}

export const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : 'Algo deu errado. Tente novamente.');

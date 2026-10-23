import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="card">
      <h1>Página não encontrada</h1>
      <p className="muted">O endereço não existe ou foi movido.</p>
      <Link className="btn" to="/">Voltar ao Dashboard</Link>
    </div>
  );
}

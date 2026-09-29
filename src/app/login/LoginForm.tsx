'use client';

import { useFormular } from '@/components/forms/useFormular';
import { login } from './actions';

export function LoginForm() {
  const { fejl, gemmer: arbejder, onSubmit } = useFormular(login);

  return (
    <form onSubmit={onSubmit} className="form">
      {fejl ? <p className="fejl">{fejl}</p> : null}
      <label className="felt">
        <span>E-mail</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label className="felt">
        <span>Adgangskode</span>
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      <button type="submit" className="btn btn-primary" disabled={arbejder}>
        {arbejder ? 'Logger ind …' : 'Log ind'}
      </button>
    </form>
  );
}

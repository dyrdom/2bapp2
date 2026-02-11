import { FormEvent, useState } from 'react';

import { login } from '../../api/auth';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      // handle successful auth flow in your app (redirect/store tokens/etc.)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to login.';
      setError(message);
      // eslint-disable-next-line no-console
      console.error('Login request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Входим...' : 'Войти'}
      </button>

      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
};

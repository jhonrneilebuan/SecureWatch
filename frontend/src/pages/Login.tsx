import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate('/');
    } catch {
      setError('Invalid credentials or API unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061018] p-6">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary p-3 text-slate-950"><Shield /></div>
          <div>
            <h1 className="text-2xl font-semibold">SecureWatch</h1>
            <p className="text-sm text-slate-500">Sign in to security monitoring</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input name="email" type="email" placeholder="admin@securewatch.com" required />
          <Input name="password" type="password" placeholder="Password" required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button className="w-full" disabled={loading}>{loading ? 'Authenticating...' : 'Login'}</Button>
        </form>
        <p className="mt-5 text-sm text-slate-500">
          Need an account? <Link className="text-primary" to="/register">Register</Link>
        </p>
      </Card>
    </div>
  );
}

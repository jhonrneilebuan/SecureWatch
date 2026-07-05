import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Role } from '../types';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await register({
        fullName: String(form.get('fullName')),
        email: String(form.get('email')),
        password: String(form.get('password')),
        role: String(form.get('role')) as Role,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data ?? 'Registration failed. The email may already be registered.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061018] p-6">
      <Card className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-semibold">Create SecureWatch Account</h1>
        <p className="mb-6 text-sm text-slate-500">Admin and Analyst roles are available in Phase 1.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input name="fullName" placeholder="Full name" required />
          <Input name="email" type="email" placeholder="email@company.com" required />
          <Input name="password" type="password" placeholder="Password" minLength={8} required />
          <p className="text-xs text-slate-500">Use 8+ characters with uppercase, lowercase, number, and special character.</p>
          <select name="role" className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100">
            <option value="Analyst">Analyst</option>
            <option value="Admin">Admin</option>
          </select>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button className="w-full">Register</Button>
        </form>
        <p className="mt-5 text-sm text-slate-500">
          Already registered? <Link className="text-primary" to="/login">Login</Link>
        </p>
      </Card>
    </div>
  );
}

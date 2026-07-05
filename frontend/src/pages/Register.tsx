import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, UserCheck, AlertTriangle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Role } from '../types';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#061018] to-[#04090e] p-4 sm:p-6 overflow-hidden">
      {/* Visual background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <Card className="relative w-full max-w-md border-slate-800/80 bg-slate-950/70 backdrop-blur-xl p-8 shadow-2xl shadow-black/60 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 duration-300 overflow-hidden">
        {/* Glow accent bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-400" />

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/20 mb-4 transform hover:rotate-6 transition-all duration-300">
            <Shield size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
              Register for Telemetry Access
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="relative">
            <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <Input name="fullName" placeholder="Full name" required className="pl-10" />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <Input name="email" type="email" placeholder="email@company.com" required className="pl-10" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <Input name="password" type="password" placeholder="Password" minLength={8} required className="pl-10" />
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-normal bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 shadow-inner">
            Password policy: 8+ characters with uppercase, lowercase, number, and special symbol.
          </p>

          <div className="relative">
            <UserCheck className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <select
              name="role"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-10 text-sm text-slate-100 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 shadow-inner shadow-black/30 appearance-none animate-in fade-in"
            >
              <option value="Analyst" className="bg-slate-950 text-slate-100">Analyst</option>
              <option value="Admin" className="bg-slate-950 text-slate-100">Admin</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-red-300 animate-pulse">
              <AlertTriangle size={14} className="shrink-0 text-danger" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <Button className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 group" disabled={loading}>
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Registering Console Account...
              </>
            ) : (
              <>
                <UserPlus size={16} className="group-hover:translate-x-0.5 transition-transform" />
                Register Account
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500 font-semibold">
          Already registered?{' '}
          <Link className="font-bold text-primary hover:text-emerald-400 transition" to="/login">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}

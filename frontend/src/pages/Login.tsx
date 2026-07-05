import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate('/');
    } catch (err: any) {
      // Prefer the server's message (e.g. lockout countdown) over the generic fallback
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data ||
        null;
      if (typeof serverMsg === 'string' && serverMsg.length < 200) {
        setError(serverMsg);
      } else {
        setError('Invalid credentials or API unavailable.');
      }
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

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/20 mb-4 transform hover:rotate-6 transition-all duration-300">
            <Shield size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              SecureWatch
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
              SOC Command Portal
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                name="email"
                type="email"
                placeholder="admin@securewatch.com"
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                className="pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-primary transition-colors duration-200 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-red-300 animate-pulse">
              <AlertTriangle size={14} className="shrink-0 text-danger" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <Button className="w-full py-2.5 flex items-center justify-center gap-2 group" disabled={loading}>
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Authenticating Session...
              </>
            ) : (
              <>
                <LogIn size={16} className="group-hover:translate-x-0.5 transition-transform" />
                Access command center
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500 font-semibold">
          Need console credentials?{' '}
          <Link className="font-bold text-primary hover:text-emerald-400 transition" to="/register">
            Register Account
          </Link>
        </p>
      </Card>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, AlertTriangle, Eye, EyeOff, Activity, Radar, Server } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#061018] to-[#04090e] p-4 text-slate-100 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/15">
            <Activity size={23} />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight text-slate-100">SecureWatch</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">SOC Command Portal</p>
          </div>
        </div>

        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/15">
              <Activity size={26} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-100">SecureWatch</p>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">AI-Powered Security Monitoring Dashboard</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl">
              SOC command access for security analysts.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Monitor uploaded logs, detect brute-force behavior, review incidents, and generate assisted security recommendations from one defensive console.
            </p>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              { label: 'Threat Engine', value: 'Online', icon: Radar },
              { label: 'Audit Trail', value: 'Enabled', icon: Server },
              { label: 'Role Access', value: 'JWT', icon: Shield },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/55 p-4 shadow-inner shadow-slate-950/60">
                  <Icon size={18} className="text-primary" />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-slate-100">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/50 p-5 shadow-inner shadow-slate-950/60">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Live Defensive Console</p>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Online
              </span>
            </div>
            <div className="space-y-3 text-xs">
              {['JWT protected routes', 'Role-based access control', 'Audit logging enabled'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="font-semibold text-slate-400">{item}</span>
                  <span className="text-primary">Active</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      <Card className="relative w-full overflow-hidden border-slate-800/80 bg-slate-950/75 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 sm:p-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-400" />
        <div className="pointer-events-none absolute inset-x-0 top-1 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="mb-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/20">
              <Shield size={28} />
            </div>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              Secure Login
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-100">Welcome back</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Authenticate to continue to the SOC Command Center.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <Input name="email" type="email" placeholder="admin@securewatch.com" required className="pl-10" />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <Input name="password" type={showPassword ? 'text' : 'password'} placeholder="SecureWatch@123" required className="pl-10 pr-11" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-primary transition-colors duration-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
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

        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Demo Credentials</p>
          <p className="mt-1 text-xs text-slate-400">admin@securewatch.com / SecureWatch@123</p>
        </div>

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/45 p-4 text-center">
          <p className="text-xs font-semibold text-slate-500">Need console credentials?</p>
          <Link className="mt-1 inline-flex font-bold text-primary transition hover:text-emerald-400" to="/register">
            Create a SecureWatch account
          </Link>
        </div>
      </Card>
      </div>
    </div>
  );
}

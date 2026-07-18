import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, UserCheck, AlertTriangle, UserPlus, Eye, EyeOff, Activity, ShieldAlert, Users } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#061018] to-[#04090e] p-4 text-slate-100 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/15">
            <Activity size={23} />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight text-slate-100">SecureWatch</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Create Console Access</p>
          </div>
        </div>

        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/15">
              <Activity size={26} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-100">SecureWatch</p>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Console Account Provisioning</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl">
              Create access for defensive security operations.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Register analyst or administrator access for log analysis, incident review, user management, and audit workflows.
            </p>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
              <ShieldAlert size={20} className="text-primary" />
              <p className="mt-3 text-sm font-black text-slate-100">Analyst</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Upload logs, analyze threats, review incidents.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-4">
              <Users size={20} className="text-primary" />
              <p className="mt-3 text-sm font-black text-slate-100">Admin</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Manage users, audit logs, records, and reports.</p>
            </div>
          </div>

          <div className="mt-6 max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/50 p-5 shadow-inner shadow-slate-950/60">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Access Provisioning Checklist</p>
            <div className="mt-4 grid gap-3 text-xs">
              {['Strong password policy', 'Admin and Analyst roles', 'Audit trail after login'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="font-semibold text-slate-400">{item}</span>
                  <span className="text-primary">Required</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      <Card className="relative w-full overflow-hidden border-slate-800/80 bg-slate-950/75 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 sm:p-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-400" />
        <div className="pointer-events-none absolute inset-x-0 top-1 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="mb-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-slate-950 shadow-lg shadow-primary/20">
              <Shield size={28} />
            </div>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              New Access
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-100">Create account</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Register for SecureWatch telemetry and SOC console access.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Full Name</span>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input name="fullName" placeholder="e.g. Juan Dela Cruz" required className="pl-10" />
            </div>
          </label>
          
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</span>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input name="email" type="email" placeholder="analyst@securewatch.com" required className="pl-10" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Password</span>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input name="password" type={showPassword ? 'text' : 'password'} placeholder="SecureWatch@123" minLength={8} required className="pl-10 pr-11" />
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

          <p className="text-[10px] text-slate-500 font-medium leading-normal bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 shadow-inner">
            Password policy: 8+ characters with uppercase, lowercase, number, and special symbol.
          </p>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Console Role</span>
            <div className="relative">
              <UserCheck className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <select
                name="role"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-10 text-sm font-semibold text-slate-100 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 shadow-inner shadow-black/30 appearance-none"
              >
                <option value="Analyst" className="bg-slate-950 text-slate-100">Analyst</option>
                <option value="Admin" className="bg-slate-950 text-slate-100">Admin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </label>

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

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/45 p-4 text-center">
          <p className="text-xs font-semibold text-slate-500">Already registered?</p>
          <Link className="mt-1 inline-flex font-bold text-primary transition hover:text-emerald-400" to="/login">
            Back to secure login
          </Link>
        </div>
      </Card>
      </div>
    </div>
  );
}

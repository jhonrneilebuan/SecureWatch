import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Shield, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { clsx } from 'clsx';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil?: string;
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const activeUsers = users.filter((user) => user.isActive).length;
  const lockedUsers = users.filter((user) => user.lockedUntil && new Date(user.lockedUntil) > new Date()).length;

  useEffect(() => {
    api.get<UserRow[]>('/users').then(({ data }) => setUsers(data)).catch(() => setUsers([]));
  }, []);

  async function reload() {
    const { data } = await api.get<UserRow[]>('/users');
    setUsers(data);
  }

  async function toggle(user: UserRow) {
    setError('');
    await api.put(`/users/${user.id}`, { fullName: user.fullName, role: user.role, isActive: !user.isActive });
    await reload();
  }

  async function updateRole(user: UserRow, role: string) {
    setError('');
    await api.put(`/users/${user.id}`, { fullName: user.fullName, role, isActive: user.isActive });
    await reload();
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) {
      return;
    }

    setError('');
    await api.delete(`/users/${user.id}`);
    await reload();
  }

  async function unlockUser(user: UserRow) {
    setError('');
    await api.post(`/users/${user.id}/unlock`);
    await reload();
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api.post('/users', {
        fullName: String(form.get('fullName')),
        email: String(form.get('email')),
        password: String(form.get('password')),
        role: String(form.get('role')),
      });
      event.currentTarget.reset();
      await reload();
    } catch (err: any) {
      setError(err.response?.data ?? 'Unable to create user. Check password policy and email uniqueness.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/35 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-primary shadow-lg shadow-primary/5">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Access Control</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100">User Console Management</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Add or manage security analysts and administrators who have console access.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total</p>
                <p className="mt-1 text-xl font-black text-slate-100">{users.length}</p>
              </div>
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary">Active</p>
                <p className="mt-1 text-xl font-black text-emerald-300">{activeUsers}</p>
              </div>
              <div className="rounded-lg border border-red-900/35 bg-red-950/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400">Locked</p>
                <p className="mt-1 text-xl font-black text-red-300">{lockedUsers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <form className="rounded-xl border border-slate-800 bg-slate-950/35 p-4" onSubmit={createUser}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100">Create Console Account</h3>
                <p className="text-[11px] text-slate-500">Provision an analyst or admin user.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Full Name</span>
                <Input name="fullName" placeholder="e.g. Maria Santos" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</span>
                <Input name="email" type="email" placeholder="analyst@securewatch.com" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Temporary Password</span>
                <Input name="password" type="password" placeholder="SecureWatch@123" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Console Role</span>
                <div className="relative">
                  <select
                    name="role"
                    className="h-11 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-sm font-semibold text-slate-100 shadow-inner outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Analyst" className="bg-slate-950">Analyst - upload, analyze, view threats</option>
                    <option value="Admin" className="bg-slate-950">Admin - full console management</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                Password policy: 8+ characters with uppercase, lowercase, number, and special character.
              </p>
            </div>

            <Button disabled={loading} className="mt-4 h-11 w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Creating Account
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="min-w-0">
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-100">Console Users</h3>
                <p className="text-[11px] text-slate-500">Review roles, lockout state, and access status.</p>
              </div>
              <ShieldCheck className="text-primary" size={18} />
            </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 uppercase text-[10px] tracking-wider bg-slate-950/40 border-b border-slate-800/80">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="px-4">Email</th>
                <th className="px-4">Role</th>
                <th className="hidden sm:table-cell px-4">Status</th>
                <th className="hidden lg:table-cell px-4">Lockout</th>
                <th className="hidden md:table-cell px-4">Created</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/10 transition-all duration-150">
                  <td className="py-3 px-4 font-semibold text-slate-200">{user.fullName}</td>
                  <td className="px-4 text-slate-400 text-xs sm:text-sm">{user.email}</td>
                  <td className="px-4">
                    <div className="relative inline-block">
                      <select
                        value={user.role}
                        onChange={(event) => updateRole(user, event.target.value)}
                        className="h-8 rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-primary/80 focus:ring-1 focus:ring-primary/20 outline-none transition-all duration-150"
                      >
                        <option value="Analyst" className="bg-slate-950">Analyst</option>
                        <option value="Admin" className="bg-slate-950">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4">
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded",
                      user.isActive ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50" : "bg-red-950/50 text-red-400 border border-red-900/50"
                    )}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4">
                    {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                      <span className="text-[10px] font-bold text-red-400">
                        Locked until {new Date(user.lockedUntil).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">{user.failedLoginCount} failed</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 text-xs text-slate-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Button variant="ghost" onClick={() => toggle(user)} className="h-8 px-2 text-[11px] font-semibold">
                        {user.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="ghost" onClick={() => unlockUser(user)} className="h-8 px-2 text-[11px] font-semibold">
                        Unlock
                      </Button>
                      <Button variant="ghost" onClick={() => deleteUser(user)} className="h-8 px-2 text-[11px] font-semibold hover:bg-red-900/20 hover:text-red-400 hover:border-danger/30">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Shield className="text-slate-700" size={30} />
              <p className="mt-3 text-sm font-semibold text-slate-400">No console users loaded.</p>
            </div>
          )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
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
    <div className="space-y-4">
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold">User Console Management</h2>
          <p className="text-xs text-slate-500">Add or manage security analysts and administrators who have console access.</p>
        </div>
        <form className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5" onSubmit={createUser}>
          <Input
            name="fullName"
            placeholder="Full name"
            required
          />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <div className="relative">
            <select
              name="role"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 shadow-inner appearance-none animate-in fade-in"
            >
              <option value="Analyst" className="bg-slate-950">Analyst</option>
              <option value="Admin" className="bg-slate-950">Admin</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <Button disabled={loading} className="h-10">
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
        <p className="mb-4 text-[10px] text-slate-500 font-medium">Password policy: 8+ characters with uppercase, lowercase, number, and special character.</p>
        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 animate-pulse">{error}</div>}
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
        </div>
      </Card>
    </div>
  );
}

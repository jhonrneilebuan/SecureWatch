import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
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
      <h2 className="mb-4 text-xl font-semibold">User Management</h2>
      <form className="mb-5 grid gap-3 md:grid-cols-5" onSubmit={createUser}>
        <input name="fullName" placeholder="Full name" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm" required />
        <input name="email" type="email" placeholder="Email" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm" required />
        <input name="password" type="password" placeholder="Password" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm" required />
        <select name="role" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"><option value="Analyst">Analyst</option><option value="Admin">Admin</option></select>
        <Button disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
      </form>
      <p className="mb-4 text-xs text-slate-500">Password policy: 8+ characters with uppercase, lowercase, number, and special character.</p>
      {error && <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-800">
                <td className="py-3">{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) => updateRole(user, event.target.value)}
                    className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm"
                  >
                    <option value="Analyst">Analyst</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td>{user.isActive ? 'Active' : 'Disabled'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="flex gap-2">
                  <Button variant="ghost" onClick={() => toggle(user)}>{user.isActive ? 'Disable' : 'Enable'}</Button>
                  <Button variant="ghost" onClick={() => deleteUser(user)}>Delete</Button>
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

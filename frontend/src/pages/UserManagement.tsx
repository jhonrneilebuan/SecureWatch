import { useEffect, useState } from 'react';
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

  useEffect(() => {
    api.get<UserRow[]>('/users').then(({ data }) => setUsers(data)).catch(() => setUsers([]));
  }, []);

  async function toggle(user: UserRow) {
    await api.put(`/users/${user.id}`, { fullName: user.fullName, role: user.role, isActive: !user.isActive });
    const { data } = await api.get<UserRow[]>('/users');
    setUsers(data);
  }

  return (
    <Card>
      <h2 className="mb-4 text-xl font-semibold">User Management</h2>
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
                <td>{user.role}</td>
                <td>{user.isActive ? 'Active' : 'Disabled'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td><Button variant="ghost" onClick={() => toggle(user)}>{user.isActive ? 'Disable' : 'Enable'}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

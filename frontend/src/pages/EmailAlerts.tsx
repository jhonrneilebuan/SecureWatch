import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { EmailAlert } from '../types';

export function EmailAlerts() {
  const [alerts, setAlerts] = useState<EmailAlert[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get<EmailAlert[]>('/emailalerts').then(({ data }) => setAlerts(data)).catch(() => setAlerts([]));
  }, []);

  const filtered = alerts.filter((alert) =>
    `${alert.subject} ${alert.recipients} ${alert.status}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Email Alerts</h2>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-3">Subject</th><th>Status</th><th>Recipients</th><th>Time</th><th>Error</th></tr></thead>
          <tbody>
            {filtered.map((alert) => (
              <tr key={alert.id} className="border-t border-slate-800">
                <td className="py-3">{alert.subject}</td>
                <td className={alert.status === 'Sent' ? 'text-primary' : alert.status === 'Failed' ? 'text-red-400' : 'text-warning'}>{alert.status}</td>
                <td>{alert.recipients}</td>
                <td>{new Date(alert.createdAt).toLocaleString()}</td>
                <td className="max-w-sm truncate text-slate-500">{alert.errorMessage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

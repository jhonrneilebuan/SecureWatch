import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
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
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Email Alerts</h2>
          <p className="text-xs text-slate-500">Log of security notifications and delivery statuses.</p>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search alerts by subject or recipient"
          className="md:w-72"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500 uppercase text-[10px] tracking-wider bg-slate-950/40 border-b border-slate-800/80">
            <tr>
              <th className="py-3.5 px-4">Subject</th>
              <th className="px-4">Status</th>
              <th className="px-4">Recipients</th>
              <th className="px-4">Time</th>
              <th className="px-4 text-right">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.map((alert) => (
              <tr key={alert.id} className="hover:bg-slate-900/10 transition-all duration-150">
                <td className="py-3.5 px-4 font-semibold text-slate-200">{alert.subject}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    alert.status === 'Sent' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' :
                    alert.status === 'Failed' ? 'bg-red-950/50 text-red-400 border-red-900/50' :
                    'bg-yellow-950/50 text-yellow-400 border-yellow-900/50'
                  }`}>
                    {alert.status}
                  </span>
                </td>
                <td className="px-4 text-slate-300 text-xs font-medium">{alert.recipients}</td>
                <td className="px-4 text-xs text-slate-500 font-medium">{new Date(alert.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right max-w-sm truncate text-xs text-slate-500 font-mono">{alert.errorMessage || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  No email alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

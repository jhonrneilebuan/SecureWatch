import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress: string;
  timestamp: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => { api.get<AuditLog[]>('/auditlogs').then(({ data }) => setLogs(data)).catch(() => setLogs([])); }, []);
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const filtered = logs.filter((log) => {
    const matchesText = `${log.action} ${log.entityType} ${log.ipAddress} ${log.userId}`.toLowerCase().includes(query.toLowerCase());
    const matchesAction = !action || log.action === action;
    const matchesDate = !date || new Date(log.timestamp).toISOString().startsWith(date);
    return matchesText && matchesAction && matchesDate;
  });

  return (
    <Card>
      <h2 className="mb-4 text-xl font-semibold">Audit Logs</h2>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, user, entity, IP" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm" />
        <select value={action} onChange={(event) => setAction(event.target.value)} className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm">
          <option value="">All actions</option>
          {actions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-3">Action</th><th>Entity</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-t border-slate-800">
                <td className="py-3">{log.action}</td><td>{log.entityType}</td><td>{log.ipAddress || '-'}</td><td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

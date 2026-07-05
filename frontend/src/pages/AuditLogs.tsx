import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

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
      <div className="mb-6">
        <h2 className="text-xl font-bold">System Audit Logs</h2>
        <p className="text-xs text-slate-500">Track and review administrative and operational actions logged across the console.</p>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search action, user, entity, IP"
        />
        <div className="relative">
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 shadow-inner appearance-none"
          >
            <option value="" className="bg-slate-950">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item} className="bg-slate-950">
                {item}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
        <Input
          value={date}
          onChange={(event) => setDate(event.target.value)}
          type="date"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500 uppercase text-[10px] tracking-wider bg-slate-950/40 border-b border-slate-800/80">
            <tr>
              <th className="py-3.5 px-4">Action</th>
              <th className="hidden sm:table-cell px-4">Entity</th>
              <th className="hidden md:table-cell px-4">IP Address</th>
              <th className="px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/10 transition-all duration-150">
                <td className="py-3.5 px-4 font-semibold text-slate-200">{log.action}</td>
                <td className="hidden sm:table-cell px-4 text-slate-400">{log.entityType}</td>
                <td className="hidden md:table-cell px-4 text-slate-400 font-mono text-xs">{log.ipAddress || '-'}</td>
                <td className="px-4 text-right text-xs text-slate-500 font-medium">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                  No matching audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

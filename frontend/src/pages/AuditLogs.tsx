import { useEffect, useState } from 'react';
import { Activity, Calendar, FileText, Filter, Search } from 'lucide-react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { PagedResult } from '../types';

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
  const [totalCount, setTotalCount] = useState(0);
  useEffect(() => {
    api.get<PagedResult<AuditLog>>('/auditlogs', {
      params: {
        search: query || undefined,
        action: action || undefined,
        date: date || undefined,
        pageSize: 50,
      },
    }).then(({ data }) => {
      setLogs(data.items);
      setTotalCount(data.totalCount);
    }).catch(() => {
      setLogs([]);
      setTotalCount(0);
    });
  }, [query, action, date]);
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/35 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-primary shadow-lg shadow-primary/5">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Activity Trail</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100">System Audit Logs</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Track administrative and operational actions across the SecureWatch console.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Showing</p>
              <p className="mt-1 text-xl font-black text-slate-100">{logs.length}</p>
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">Total</p>
              <p className="mt-1 text-xl font-black text-emerald-300">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search action, user, entity, IP"
              className="h-11 pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/60 px-10 text-sm text-slate-100 shadow-inner outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/20"
            >
              <option value="" className="bg-slate-950">All actions</option>
              {actions.map((item) => (
                <option key={item} value={item} className="bg-slate-950">
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <Input
              value={date}
              onChange={(event) => setDate(event.target.value)}
              type="date"
              className="h-11 pl-10"
            />
          </div>
        </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20 shadow-inner shadow-slate-950/40">
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
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/10 transition-all duration-150">
                <td className="py-3.5 px-4 font-semibold text-slate-200">{log.action}</td>
                <td className="hidden sm:table-cell px-4 text-slate-400">{log.entityType}</td>
                <td className="hidden md:table-cell px-4 text-slate-400 font-mono text-xs">{log.ipAddress || '-'}</td>
                <td className="px-4 text-right text-xs text-slate-500 font-medium">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                  <Activity className="mx-auto mb-2 text-slate-700" size={24} />
                  No matching audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </Card>
  );
}

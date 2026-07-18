import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Mail, Search, Send, XCircle } from 'lucide-react';
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
  const sentCount = alerts.filter((alert) => alert.status === 'Sent').length;
  const failedCount = alerts.filter((alert) => alert.status === 'Failed').length;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/35 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-primary shadow-lg shadow-primary/5">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Notification Delivery</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100">Email Alerts</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Review SMTP alert delivery, recipients, and failure details.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total</p>
              <p className="mt-1 text-xl font-black text-slate-100">{alerts.length}</p>
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">Sent</p>
              <p className="mt-1 text-xl font-black text-emerald-300">{sentCount}</p>
            </div>
            <div className="rounded-lg border border-red-900/35 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-400">Failed</p>
              <p className="mt-1 text-xl font-black text-red-300">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-500">
            <Send size={14} className="text-primary" />
            SMTP delivery history
          </div>
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subject, recipient, status"
              className="h-11 pl-10"
            />
          </div>
        </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20 shadow-inner shadow-slate-950/40">
        <table className="w-full min-w-[46rem] text-left text-sm">
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
                    {alert.status === 'Sent' && <CheckCircle2 className="mr-1 inline" size={11} />}
                    {alert.status === 'Failed' && <XCircle className="mr-1 inline" size={11} />}
                    {alert.status !== 'Sent' && alert.status !== 'Failed' && <AlertTriangle className="mr-1 inline" size={11} />}
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
                  <Mail className="mx-auto mb-2 text-slate-700" size={24} />
                  No email alerts found.
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

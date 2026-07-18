import { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Radar, ShieldCheck, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { WorldThreatMap } from '../components/WorldThreatMap';
import { Card } from '../components/ui/card';
import { DashboardSummary, Incident, PagedResult } from '../types';

const colors = ['#34d399', '#f59e0b', '#fb7185', '#a855f7'];

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<DashboardSummary>('/dashboard/summary'),
      api.get<PagedResult<Incident>>('/incidents', { params: { pageSize: 5 } }),
    ])
      .then(([summaryResponse, incidentsResponse]) => {
        setSummary(summaryResponse.data);
        setIncidents(incidentsResponse.data.items);
      })
      .catch(() => setError('Unable to load dashboard metrics.'));
  }, []);

  if (error) {
    return <Card className="border-danger/35 bg-danger/5"><p className="text-sm font-semibold text-red-400">{error}</p></Card>;
  }

  if (!summary) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-primary mx-auto" />
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading security telemetry...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Logs', value: summary.totalLogs, icon: FileText },
    { label: 'Threats', value: summary.threatsDetected, icon: Radar },
    { label: 'High Risk', value: summary.highRiskAlerts, icon: AlertTriangle },
    { label: 'Critical', value: summary.criticalAlerts, icon: AlertTriangle },
    { label: 'Incidents', value: summary.activeIncidents, icon: ShieldCheck },
    { label: 'Malicious IPs', value: summary.maliciousIps, icon: Radar },
    { label: 'Failed Logins', value: summary.failedLoginAttempts, icon: AlertTriangle },
  ];
  return (
    <div className="space-y-6">
      {/* Overview stats panel */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <WorldThreatMap topCountries={summary.topCountries} />

      {/* Main charts grid */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Attack Timeline</h2>
            <TrendingUp size={16} className="text-primary" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.attackTimeline.length ? summary.attackTimeline : [{ date: 'No data', threats: 0 }]}>
                <defs>
                  <linearGradient id="attackTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090f16', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="threats" stroke="#34d399" strokeWidth={2.5} fill="url(#attackTimelineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Threat Severity</h2>
          <div className="h-72 flex flex-col justify-between">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.threatSeverity.length ? summary.threatSeverity : [{ severity: 'No data', count: 1 }]}
                    dataKey="count"
                    nameKey="severity"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {(summary.threatSeverity.length ? summary.threatSeverity : [{ severity: 'No data', count: 1 }]).map((_, index) => (
                      <Cell key={index} fill={summary.threatSeverity.length ? colors[index % colors.length] : '#334155'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#090f16', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom styled Legend */}
            <div className="flex justify-center gap-4 text-xs font-semibold flex-wrap">
              {summary.threatSeverity.map((item, idx) => (
                <div key={item.severity} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                  <span className="text-slate-400 capitalize">{item.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Secondary charts grid */}
      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Failed Login Attempts</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.failedLoginTimeline.length ? summary.failedLoginTimeline : [{ date: 'No data', failedAttempts: 0 }]}>
                <defs>
                  <linearGradient id="failedAttemptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090f16', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="failedAttempts" fill="url(#failedAttemptsGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Top Attacking IP Addresses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.topAttackingIps.length ? summary.topAttackingIps : [{ ipAddress: 'No data', count: 0 }]}>
                <defs>
                  <linearGradient id="topIpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ipAddress" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090f16', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="url(#topIpsGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-200">Recent Incidents</h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500">No incidents recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 uppercase text-[10px] tracking-wider bg-slate-950/40 border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="px-4">Priority</th>
                  <th className="px-4">Status</th>
                  <th className="px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-900/10 transition-all duration-150">
                    <td className="py-3 px-4 font-semibold text-slate-200">{incident.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        incident.priority === 'Critical' ? 'bg-red-950/50 text-red-400 border-red-900/50' :
                        incident.priority === 'High' ? 'bg-orange-950/50 text-orange-400 border-orange-900/50' :
                        incident.priority === 'Medium' ? 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50' :
                        'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
                      }`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        incident.status === 'Resolved' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' :
                        'bg-rose-950/50 text-rose-400 border-rose-900/50'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 font-medium">
                      {new Date(incident.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

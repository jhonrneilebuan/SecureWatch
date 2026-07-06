import { useEffect, useState } from 'react';
import { AlertTriangle, FileText, MapPin, Radar, ShieldCheck, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { DashboardSummary, Incident, PagedResult } from '../types';

const colors = ['#34d399', '#f59e0b', '#fb7185', '#a855f7'];

const countryCoordinates: Record<string, { x: number; y: number; label: string }> = {
  US: { x: 24, y: 43, label: 'United States' },
  CA: { x: 22, y: 31, label: 'Canada' },
  BR: { x: 38, y: 68, label: 'Brazil' },
  GB: { x: 47, y: 34, label: 'United Kingdom' },
  DE: { x: 51, y: 37, label: 'Germany' },
  FR: { x: 49, y: 41, label: 'France' },
  NL: { x: 49, y: 36, label: 'Netherlands' },
  RU: { x: 66, y: 32, label: 'Russia' },
  CN: { x: 73, y: 47, label: 'China' },
  JP: { x: 83, y: 49, label: 'Japan' },
  IN: { x: 68, y: 55, label: 'India' },
  SG: { x: 73, y: 68, label: 'Singapore' },
  AU: { x: 80, y: 78, label: 'Australia' },
};

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
  const maxCountryHits = Math.max(...summary.topCountries.map((item) => item.count), 1);
  const maxIspHits = Math.max(...summary.topIsps.map((item) => item.count), 1);
  const targetNode = { x: 50, y: 48, label: 'SecureWatch SOC' };
  const countryMarkers = summary.topCountries.map((item, index) => {
    const key = item.name.toUpperCase();
    const mapped = countryCoordinates[key] ?? {
      x: 18 + ((index * 17) % 66),
      y: 28 + ((index * 13) % 46),
      label: item.name,
    };
    return { ...item, ...mapped, code: key };
  });
  const threatRoutes = countryMarkers.map((item, index) => ({
    ...item,
    delay: `${index * 0.75}s`,
    width: Math.max(1.5, Math.min(4, 1 + item.count / maxCountryHits * 3)),
  }));

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

      {/* Geolocation map and ISP rankings */}
      <section className="grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3 overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Global Attack Origin Map</h2>
              <p className="mt-1 text-xs text-slate-600">Country markers are based on IP reputation geolocation results.</p>
            </div>
            <span className="rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase text-primary">
              {summary.topCountries.reduce((total, item) => total + item.count, 0)} geo hits
            </span>
          </div>

          {countryMarkers.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No geolocation country data logged yet.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="relative h-80 overflow-hidden rounded-xl border border-cyan-900/50 bg-[#041019] shadow-inner shadow-cyan-950/60">
                <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(34,211,238,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.16)_1px,transparent_1px)] [background-size:38px_38px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(20,184,166,.18),transparent_28%),radial-gradient(circle_at_18%_34%,rgba(244,63,94,.10),transparent_18%),radial-gradient(circle_at_70%_40%,rgba(34,211,238,.10),transparent_24%)]" />
                <div className="absolute left-[10%] top-[22%] h-24 w-36 rounded-[45%] border border-cyan-800/50 bg-cyan-950/10" />
                <div className="absolute left-[38%] top-[20%] h-28 w-32 rounded-[42%] border border-cyan-800/50 bg-cyan-950/10" />
                <div className="absolute left-[56%] top-[28%] h-24 w-48 rounded-[45%] border border-cyan-800/50 bg-cyan-950/10" />
                <div className="absolute left-[70%] top-[68%] h-16 w-24 rounded-[45%] border border-cyan-800/50 bg-cyan-950/10" />
                <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-800/25" />
                <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-800/25" />
                <div className="absolute left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-800/25" />
                <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] origin-center -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-t border-cyan-400/40" style={{ animationDuration: '10s' }} />

                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="attackRoute" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity="0.08" />
                      <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.15" />
                    </linearGradient>
                    <filter id="routeGlow">
                      <feGaussianBlur stdDeviation="0.75" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {threatRoutes.map((route) => {
                    const midX = (route.x + targetNode.x) / 2;
                    const midY = Math.min(route.y, targetNode.y) - 16;
                    return (
                      <path
                        key={`${route.code}-route`}
                        d={`M ${route.x} ${route.y} Q ${midX} ${midY} ${targetNode.x} ${targetNode.y}`}
                        fill="none"
                        stroke="url(#attackRoute)"
                        strokeWidth={route.width}
                        strokeDasharray="3 5"
                        strokeLinecap="round"
                        filter="url(#routeGlow)"
                        opacity="0.9"
                        style={{
                          animation: `dashFlow 2.8s linear infinite`,
                          animationDelay: route.delay,
                        }}
                      />
                    );
                  })}
                </svg>

                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${targetNode.x}%`, top: `${targetNode.y}%` }}
                  title={targetNode.label}
                >
                  <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-primary/15" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary bg-slate-950 text-primary shadow-xl shadow-primary/20">
                    <Radar size={24} />
                  </span>
                  <span className="absolute left-1/2 top-16 -translate-x-1/2 whitespace-nowrap rounded border border-primary/30 bg-slate-950/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                    SOC Core
                  </span>
                </div>

                {countryMarkers.map((item) => {
                  const size = 14 + Math.round((item.count / maxCountryHits) * 18);
                  const critical = item.count === maxCountryHits;
                  return (
                    <div
                      key={item.code}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      title={`${item.label}: ${item.count} hits`}
                    >
                      <span className={`absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full ${critical ? 'bg-danger/25' : 'bg-cyan-400/20'}`} />
                      <span
                        className={`relative flex items-center justify-center rounded-full border text-[10px] font-black shadow-lg ${
                          critical
                            ? 'border-danger bg-danger/90 text-white shadow-danger/25'
                            : 'border-cyan-300/80 bg-cyan-400/90 text-slate-950 shadow-cyan-400/20'
                        }`}
                        style={{ width: size, height: size }}
                      >
                        {item.code}
                      </span>
                    </div>
                  );
                })}

                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-900/60 bg-slate-950/80 px-3 py-2 backdrop-blur">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                    Live threat visualization
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">Animated from latest reputation telemetry</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg border border-cyan-900/50 bg-slate-950/50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Recent Attack Routes</p>
                </div>
                {countryMarkers.map((item) => (
                  <div key={item.code} className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin size={14} className="shrink-0 text-primary" />
                        <span className="truncate text-sm font-bold text-slate-200">{item.label}</span>
                      </div>
                      <span className="shrink-0 text-xs font-black text-slate-100">{item.count}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      <span>{item.code}</span>
                      <span className="h-px flex-1 bg-slate-800" />
                      <span>SOC Core</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900">
                      <div className="h-full rounded-full bg-gradient-to-r from-danger via-cyan-400 to-primary" style={{ width: `${Math.max(8, (item.count / maxCountryHits) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Top Threat ISPs</h2>
            <p className="mt-1 text-xs text-slate-600">Ranked networks observed during IP reputation checks.</p>
          </div>
          {summary.topIsps.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No IP reputation ISP data logged yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.topIsps.map((item, index) => (
                <div key={item.name} className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-800 bg-slate-900 text-xs font-black text-primary">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-bold text-slate-200">{item.name}</span>
                    </div>
                    <span className="shrink-0 rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-slate-300">{item.count} hits</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      style={{ width: `${Math.max(8, (item.count / maxIspHits) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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

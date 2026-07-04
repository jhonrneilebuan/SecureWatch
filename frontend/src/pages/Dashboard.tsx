import { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Radar, ShieldCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { DashboardSummary } from '../types';

const colors = ['#34d399', '#f59e0b', '#fb7185', '#a855f7'];

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardSummary>('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Unable to load dashboard metrics.'));
  }, []);

  if (error) {
    return <Card><p className="text-red-400">{error}</p></Card>;
  }

  if (!summary) {
    return <Card><p className="text-slate-400">Loading dashboard telemetry...</p></Card>;
  }

  const stats = [
    { label: 'Total Logs', value: summary.totalLogs, icon: FileText },
    { label: 'Threats Detected', value: summary.threatsDetected, icon: Radar },
    { label: 'High Risk Alerts', value: summary.highRiskAlerts, icon: AlertTriangle },
    { label: 'Critical Alerts', value: summary.criticalAlerts, icon: AlertTriangle },
    { label: 'Active Incidents', value: summary.activeIncidents, icon: ShieldCheck },
    { label: 'Malicious IPs', value: summary.maliciousIps, icon: Radar },
    { label: 'Failed Login Attempts', value: summary.failedLoginAttempts, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                </div>
                <Icon className="text-primary" size={28} />
              </div>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Attack Timeline</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={summary.attackTimeline}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b' }} />
                <Line type="monotone" dataKey="threats" stroke="#34d399" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-semibold">Threat Severity</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={summary.threatSeverity} dataKey="count" nameKey="severity" innerRadius={55} outerRadius={90}>
                  {summary.threatSeverity.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-base font-semibold">Failed Login Attempts Over Time</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={summary.attackTimeline}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b' }} />
              <Bar dataKey="threats" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 text-base font-semibold">Top Attacking IP Addresses</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={summary.topAttackingIps}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="ipAddress" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b' }} />
              <Bar dataKey="count" fill="#fb7185" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      </section>
    </div>
  );
}

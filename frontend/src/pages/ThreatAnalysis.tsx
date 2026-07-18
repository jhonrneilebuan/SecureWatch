import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Activity, AlertTriangle, Filter, Radar, Search } from 'lucide-react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { PagedResult, Threat } from '../types';

export function ThreatAnalysis() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    api.get<PagedResult<Threat>>('/threats', { params: { pageSize: 50 } }).then(({ data }) => setThreats(data.items)).catch(() => setThreats([]));
  }, []);

  const filteredThreats = threats.filter((threat) => {
    const matchesQuery = `${threat.threatType} ${threat.sourceIP} ${threat.description} ${threat.mitreTechniqueId}`.toLowerCase().includes(query.toLowerCase());
    const matchesSeverity = !severityFilter || threat.severity.toLowerCase() === severityFilter.toLowerCase();
    return matchesQuery && matchesSeverity;
  });
  const criticalCount = threats.filter((threat) => threat.severity.toLowerCase() === 'critical' || threat.riskScore >= 90).length;
  const highCount = threats.filter((threat) => threat.severity.toLowerCase() === 'high').length;
  const avgRisk = threats.length ? Math.round(threats.reduce((sum, threat) => sum + threat.riskScore, 0) / threats.length) : 0;
  const severities = Array.from(new Set(threats.map((threat) => threat.severity))).sort();

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950/25 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-red-400 shadow-lg shadow-red-950/10">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">SOC Command Center</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100">Threat Analysis Workspace</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Triage alerts processed by SecureWatch, inspect source IPs, MITRE mappings, risk scores, and recommendations.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Threats</p>
                <p className="mt-1 text-xl font-black text-slate-100">{threats.length}</p>
              </div>
              <div className="rounded-lg border border-red-900/40 bg-red-950/25 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400">Critical</p>
                <p className="mt-1 text-xl font-black text-red-300">{criticalCount}</p>
              </div>
              <div className="rounded-lg border border-orange-900/40 bg-orange-950/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">Avg Risk</p>
                <p className="mt-1 text-xl font-black text-orange-300">{avgRisk}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search threat type, source IP, MITRE ID, description"
              className="h-11 pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/60 px-10 text-sm text-slate-100 shadow-inner outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/20"
            >
              <option value="" className="bg-slate-950">All severities</option>
              {severities.map((severity) => (
                <option key={severity} value={severity} className="bg-slate-950">{severity}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-red-900/30 bg-red-950/15 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
                <AlertTriangle size={14} />
                Critical Queue
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{criticalCount} threat(s) need immediate review.</p>
            </div>
            <div className="rounded-lg border border-orange-900/30 bg-orange-950/15 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-400">
                <Radar size={14} />
                High Priority
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{highCount} high severity alert(s) detected.</p>
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                <Activity size={14} />
                Visible Results
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{filteredThreats.length} item(s) match current filters.</p>
            </div>
          </div>
        </div>
      </Card>

      {threats.length === 0 && (
        <Card className="text-center py-10">
          <Activity size={32} className="mx-auto text-slate-500 animate-pulse mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No threats detected yet.</p>
          <p className="text-xs text-slate-600 mt-1">Upload logs to initiate security telemetry analysis.</p>
        </Card>
      )}

      {threats.length > 0 && filteredThreats.length === 0 && (
        <Card className="py-10 text-center">
          <Search size={30} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm font-semibold text-slate-400">No threats match the current filters.</p>
          <p className="mt-1 text-xs text-slate-600">Adjust search text or severity filter.</p>
        </Card>
      )}

      {filteredThreats.map((threat) => {
        const severity = threat.severity.toLowerCase();
        const isCritical = threat.riskScore >= 80 || severity === 'critical';
        const isHigh = severity === 'high';
        const isMedium = severity === 'medium';

        return (
          <Card
            key={threat.id}
            className={`overflow-hidden border-l-4 transition-all duration-300 ${
              isCritical ? 'border-l-danger hover:border-danger/60' :
              isHigh ? 'border-l-warning hover:border-warning/60' :
              isMedium ? 'border-l-yellow-500 hover:border-yellow-500/60' :
              'border-l-primary hover:border-primary/60'
            }`}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 rounded-lg p-2.5 shrink-0 ${
                  isCritical ? 'bg-danger/10 text-danger' :
                  isHigh ? 'bg-warning/10 text-warning' :
                  isMedium ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-primary/10 text-primary'
                }`}>
                  <ShieldAlert size={20} className={isCritical ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-200">{threat.threatType}</h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      isCritical ? 'bg-red-950/50 text-red-400 border-red-900/50' :
                      isHigh ? 'bg-orange-950/50 text-orange-400 border-orange-900/50' :
                      isMedium ? 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50' :
                      'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
                    }`}>
                      {threat.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">{threat.description}</p>
                  
                  {threat.recommendation && (
                    <div className="mt-3 rounded-lg bg-slate-900/40 border border-slate-800/40 p-3 text-xs text-primary leading-relaxed">
                      <span className="font-bold uppercase text-[9px] tracking-wider block mb-1">Recommendation</span>
                      {threat.recommendation}
                    </div>
                  )}

                  {threat.mitreTechniqueId && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300">
                      MITRE ATT&CK
                      <span className="text-primary">{threat.mitreTechniqueId}</span>
                      <span className="normal-case tracking-normal text-slate-500">{threat.mitreTechniqueName}</span>
                    </div>
                  )}

                  <Link
                    to={`/threats/${threat.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/15 hover:text-emerald-300"
                  >
                    Investigate Threat
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              <div className="w-full md:w-56 shrink-0 border-t border-slate-800 md:border-t-0 md:border-l md:border-slate-800/80 pt-4 md:pt-0 md:pl-5 flex flex-wrap md:flex-col gap-x-6 gap-y-2.5 text-xs text-slate-400">
                <div className="flex-1 md:flex-none">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Source IP</p>
                  <p className="mt-0.5 font-mono text-slate-200 font-semibold">{threat.sourceIP}</p>
                </div>
                <div className="flex-1 md:flex-none">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Score</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`font-black text-sm ${
                      isCritical ? 'text-danger' :
                      isHigh ? 'text-warning' :
                      'text-primary'
                    }`}>{threat.riskScore}</span>
                    <div className="w-20 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          isCritical ? 'bg-danger' :
                          isHigh ? 'bg-warning' :
                          'bg-primary'
                        }`}
                        style={{ width: `${threat.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 md:flex-none">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Failed Attempts</p>
                  <p className="mt-0.5 text-slate-200 font-semibold">{threat.failedAttempts}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Terminal, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Threat } from '../types';

export function ThreatDetails() {
  const { id } = useParams();
  const [threat, setThreat] = useState<Threat | null>(null);

  useEffect(() => {
    if (id) api.get<Threat>(`/threats/${id}`).then(({ data }) => setThreat(data)).catch(() => setThreat(null));
  }, [id]);

  if (!threat) {
    return (
      <Card className="text-center py-10">
        <AlertTriangle size={32} className="mx-auto text-danger mb-3" />
        <p className="text-sm font-semibold text-slate-300">Threat details not found.</p>
        <Link to="/threats" className="mt-4 inline-block">
          <Button variant="ghost" className="text-xs">
            <ArrowLeft size={12} className="mr-1" /> Back to Threat Feed
          </Button>
        </Link>
      </Card>
    );
  }

  const severity = threat.severity.toLowerCase();
  const isCritical = threat.riskScore >= 80 || severity === 'critical';
  const isHigh = severity === 'high';
  const isMedium = severity === 'medium';

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/threats" className="inline-block">
        <Button variant="ghost" className="h-9 px-3 text-xs">
          <ArrowLeft size={14} className="mr-1.5" /> Back to Threat Feed
        </Button>
      </Link>

      <Card
        className={`border-l-4 ${
          isCritical ? 'border-l-danger' :
          isHigh ? 'border-l-warning' :
          isMedium ? 'border-l-yellow-500' :
          'border-l-primary'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`rounded-lg p-2.5 shrink-0 ${
            isCritical ? 'bg-danger/10 text-danger' :
            isHigh ? 'bg-warning/10 text-warning' :
            isMedium ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-primary/10 text-primary'
          }`}>
            <ShieldAlert size={24} className={isCritical ? 'animate-bounce' : ''} />
          </div>
          <div>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
              isCritical ? 'bg-red-950/50 text-red-400 border-red-900/50' :
              isHigh ? 'bg-orange-950/50 text-orange-400 border-orange-900/50' :
              isMedium ? 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50' :
              'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
            }`}>
              {threat.severity}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2">{threat.threatType}</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/40 p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Score</p>
            <p className="mt-1.5 text-2xl font-black text-slate-200">{threat.riskScore}%</p>
            <div className="mt-2 w-full bg-slate-950 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${
                  isCritical ? 'bg-danger' :
                  isHigh ? 'bg-warning' :
                  'bg-primary'
                }`}
                style={{ width: `${threat.riskScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-800/40 p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Source IP Address</p>
            <p className="mt-2 text-md font-mono font-bold text-slate-200 truncate">{threat.sourceIP}</p>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-800/40 p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Failed Attempts</p>
            <p className="mt-2 text-lg font-bold text-slate-200">{threat.failedAttempts}</p>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-800/40 p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attack Severity</p>
            <p className="mt-2 text-md font-bold text-slate-200 capitalize">{severity}</p>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-800/40 p-4 sm:col-span-2 md:col-span-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">MITRE ATT&CK Mapping</p>
            <p className="mt-2 text-sm font-bold text-slate-200">
              <span className="font-mono text-primary">{threat.mitreTechniqueId || 'Unmapped'}</span>
              {threat.mitreTechniqueName && <span className="ml-2 text-slate-400">{threat.mitreTechniqueName}</span>}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-6">
          <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Description</h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed font-medium">{threat.description}</p>
        </div>

        {threat.recommendation && (
          <div className="mt-6 border-t border-slate-800/80 pt-6">
            <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Analyst Recommendation</h3>
            <p className="mt-2 text-sm text-primary leading-relaxed font-semibold">{threat.recommendation}</p>
          </div>
        )}
      </Card>

      {threat.aiPreventionSteps && (
        <Card className="border-primary/20 bg-slate-950/30">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-3">
            <Terminal size={18} className="text-primary shrink-0 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">AI-Suggested Remediation & Prevention Steps</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-900 shadow-inner">
            {threat.aiPreventionSteps}
          </p>
        </Card>
      )}
    </div>
  );
}

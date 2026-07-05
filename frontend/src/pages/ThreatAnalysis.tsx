import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Threat } from '../types';

export function ThreatAnalysis() {
  const [threats, setThreats] = useState<Threat[]>([]);

  useEffect(() => {
    api.get<Threat[]>('/threats').then(({ data }) => setThreats(data)).catch(() => setThreats([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Threat Intelligence Feed</h2>
        <p className="text-xs text-slate-500">Real-time alerts processed by the SecureWatch security engine.</p>
      </div>

      {threats.length === 0 && (
        <Card className="text-center py-10">
          <Activity size={32} className="mx-auto text-slate-500 animate-pulse mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No threats detected yet.</p>
          <p className="text-xs text-slate-600 mt-1">Upload logs to initiate security telemetry analysis.</p>
        </Card>
      )}

      {threats.map((threat) => {
        const isCritical = threat.riskScore >= 80 || threat.severity === 'CRITICAL';
        const isHigh = threat.severity === 'HIGH';
        const isMedium = threat.severity === 'MEDIUM';

        return (
          <Card
            key={threat.id}
            className={`border-l-4 transition-all duration-300 ${
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

                  <Link
                    to={`/threats/${threat.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-400 transition"
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

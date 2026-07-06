import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { SystemStatus } from '../types';
import { CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 py-3.5 text-sm">
      <span className="text-slate-300 font-semibold">{label}</span>
      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
        ok ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' : 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50 animate-pulse'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-450' : 'bg-warning'}`} />
        {ok ? 'Configured' : 'Missing'}
      </span>
    </div>
  );
}

export function Settings() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    api.get<SystemStatus>('/settings/status').then(({ data }) => setStatus(data)).catch(() => setStatus(null));
  }, []);

  if (!status) {
    return (
      <Card className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-primary mx-auto" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-4">Loading configurations...</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Activity size={18} className="text-primary" />
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-200">Integration Health Status</h2>
        </div>
        <div className="mt-2 divide-y divide-slate-800/40">
          <StatusRow label="SMTP Email Alert Gateway" ok={status.smtpConfigured} />
          <StatusRow label="OpenAI GPT Recommendations Engine" ok={status.openAiConfigured} />
          <StatusRow label="AbuseIPDB Threat Intelligence API" ok={status.abuseIpDbConfigured} />
          <StatusRow label="VirusTotal Threat Intelligence API" ok={status.virusTotalConfigured} />
          <StatusRow label="Shodan Internet Exposure API" ok={status.shodanConfigured} />
          <StatusRow label="AlienVault OTX Threat Intelligence API" ok={status.otxConfigured} />
          <StatusRow label="NVD Vulnerability Database API" ok={status.nvdConfigured} />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <ShieldCheck size={18} className="text-primary" />
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-200">Security Parameters</h2>
        </div>
        <div className="mt-4 space-y-4 text-xs text-slate-350 font-medium">
          <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/60 p-3 rounded-lg">
            <span>Failed Login Lockout Threshold</span>
            <span className="text-slate-100 font-mono font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-850">
              {status.failedLoginLockoutThreshold} attempts
            </span>
          </div>
          
          <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/60 p-3 rounded-lg">
            <span>Email Alerts Recorded (90 Days)</span>
            <span className="text-slate-100 font-mono font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-850">
              {status.recentEmailAlerts}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/60 p-3 rounded-lg">
            <span>Failed Email Notifications</span>
            <span className={`font-mono font-bold bg-slate-950 px-2.5 py-1 rounded border ${
              status.failedEmailAlerts > 0 ? 'text-red-400 border-danger/30' : 'text-slate-100 border-slate-850'
            }`}>
              {status.failedEmailAlerts}
            </span>
          </div>
          
          <div className="p-3 bg-slate-950/40 rounded-lg text-[10px] text-slate-500 italic leading-relaxed">
            Note: User authentication JSON Web Tokens (JWT) sessions expire automatically based on background security token expirations.
          </div>
        </div>
      </Card>
    </div>
  );
}

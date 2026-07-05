import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { SystemStatus } from '../types';

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-3 text-sm">
      <span>{label}</span>
      <span className={ok ? 'text-primary' : 'text-warning'}>{ok ? 'Configured' : 'Missing'}</span>
    </div>
  );
}

export function Settings() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    api.get<SystemStatus>('/settings/status').then(({ data }) => setStatus(data)).catch(() => setStatus(null));
  }, []);

  if (!status) {
    return <Card><p className="text-slate-400">Loading configuration health...</p></Card>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold">Configuration Health</h2>
        <div className="mt-4">
          <StatusRow label="SMTP email alerts" ok={status.smtpConfigured} />
          <StatusRow label="OpenAI recommendations" ok={status.openAiConfigured} />
          <StatusRow label="AbuseIPDB reputation" ok={status.abuseIpDbConfigured} />
          <StatusRow label="NVD CVE API" ok={status.nvdConfigured} />
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Security Controls</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p>Failed login lockout threshold: {status.failedLoginLockoutThreshold}</p>
          <p>Email alerts recorded: {status.recentEmailAlerts}</p>
          <p>Failed email alerts: {status.failedEmailAlerts}</p>
          <p>JWT sessions expire according to backend configuration.</p>
        </div>
      </Card>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { AlertTriangle, Globe, Loader2, Radar, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { IpReputation as IpReputationType } from '../types';
import { clsx } from 'clsx';

export function IpReputation() {
  const [result, setResult] = useState<IpReputationType | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    const ip = String(new FormData(event.currentTarget).get('ip'));
    try {
      const { data } = await api.get<IpReputationType>(`/lookups/ip/${ip}`);
      setResult(data);
    } catch {
      setError('Unable to check IP reputation. Verify API key, network, or try another IP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/35 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-primary shadow-lg shadow-primary/5">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Threat Intelligence</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100">IP Reputation Query</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Query external intelligence data to check abuse confidence, network ownership, and geolocation.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">Provider</p>
              <p className="mt-1 text-sm font-black text-slate-100">AbuseIPDB + Geo Enrichment</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]" onSubmit={onSubmit}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
              <Input name="ip" placeholder="e.g. 8.8.8.8, 1.1.1.1, 192.168.1.10" required className="h-12 pl-10 text-sm" />
            </div>
            <Button disabled={loading} className="h-12">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Checking
                </span>
              ) : (
                'Check Reputation'
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ['Confidence Score', 'Abuse verdict based on recent reports.'],
                ['Network Owner', 'ISP and infrastructure context.'],
                ['Geo Signal', 'Country and coordinates for dashboard map.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-lg border border-slate-800 bg-slate-950/35 p-4">
                  <Radar className="mb-3 text-primary" size={18} />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-300">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {result && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Target Address</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{result.ipAddress}</h3>
            </div>
            <div className={clsx(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border",
              result.isMalicious
                ? "bg-danger/10 border-danger/30 text-red-400"
                : "bg-primary/10 border-primary/30 text-emerald-400"
            )}>
              {result.isMalicious ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
              {result.isMalicious ? 'Malicious Activity Detected' : 'No Threat Detected'}
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4">
              <p className="text-xs text-slate-500 font-semibold">Abuse Confidence Score</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-bold text-slate-100">{result.abuseConfidenceScore}%</span>
                <span className={clsx(
                  "text-xs font-semibold px-2 py-0.5 rounded",
                  result.abuseConfidenceScore >= 75 ? "bg-red-950 text-red-400" :
                  result.abuseConfidenceScore >= 25 ? "bg-yellow-950 text-yellow-400" :
                  "bg-emerald-950 text-emerald-400"
                )}>
                  {result.abuseConfidenceScore >= 75 ? 'Critical' : result.abuseConfidenceScore >= 25 ? 'Suspicious' : 'Safe'}
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-500",
                    result.abuseConfidenceScore >= 75 ? "bg-danger" :
                    result.abuseConfidenceScore >= 25 ? "bg-warning" :
                    "bg-primary"
                  )}
                  style={{ width: `${result.abuseConfidenceScore}%` }}
                />
              </div>
            </div>
            
            <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4">
              <p className="text-xs text-slate-500 font-semibold">ISP / Network</p>
              <p className="mt-2 text-md font-bold text-slate-200 truncate">{result.isp || 'Unknown Network'}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Autonomous System</p>
            </div>

            <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4">
              <p className="text-xs text-slate-500 font-semibold">Geo Details</p>
              <p className="mt-2 text-md font-bold text-slate-200">{result.countryCode || 'Local/Internal'}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                {result.latitude != null && result.longitude != null
                  ? `${result.latitude.toFixed(3)}, ${result.longitude.toFixed(3)}`
                  : 'ISO Country Code'}
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4 sm:col-span-2 md:col-span-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Threat Reports Logged</p>
                <p className="mt-1 text-slate-300 text-xs">Total reports submitted by global security sensors in the last 90 days. Reports are context; the confidence score determines the verdict.</p>
              </div>
              <span className="text-2xl font-black text-slate-100 shrink-0">{result.totalReports}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

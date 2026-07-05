import { FormEvent, useState } from 'react';
import { Globe, ShieldAlert, ShieldCheck } from 'lucide-react';
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
    <Card className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Globe size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">IP Reputation Query</h2>
          <p className="text-xs text-slate-500">Query external threat intelligence data (AbuseIPDB) to check if an IP is associated with attacks.</p>
        </div>
      </div>
      <form className="mt-4 flex flex-col sm:flex-row gap-3" onSubmit={onSubmit}>
        <Input name="ip" placeholder="e.g. 192.168.1.10, 8.8.8.8" required className="flex-1" />
        <Button disabled={loading}>{loading ? 'Querying...' : 'Check Reputation'}</Button>
      </form>
      {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}
      {result && (
        <div className="mt-8 border-t border-slate-800/80 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              <p className="text-[10px] text-slate-500 font-semibold mt-1">ISO Country Code</p>
            </div>

            <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4 sm:col-span-2 md:col-span-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Threat Reports Logged</p>
                <p className="mt-1 text-slate-300 text-xs">Total reports submitted by global security sensors in the last 90 days.</p>
              </div>
              <span className="text-2xl font-black text-slate-100 shrink-0">{result.totalReports}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

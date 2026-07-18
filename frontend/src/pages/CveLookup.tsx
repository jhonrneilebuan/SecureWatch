import { FormEvent, useState } from 'react';
import { AlertTriangle, Bug, ExternalLink, Loader2, Search, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { CveRecord } from '../types';
import { clsx } from 'clsx';

export function CveLookup() {
  const [records, setRecords] = useState<CveRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const visibleRecords = records.slice((page - 1) * pageSize, page * pageSize);
  const highRiskCount = records.filter((record) => ['CRITICAL', 'HIGH'].includes(record.severity?.toUpperCase())).length;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const query = String(new FormData(event.currentTarget).get('query'));
    try {
      const { data } = await api.get<CveRecord[]>(`/lookups/cve?query=${encodeURIComponent(query)}`);
      setRecords(data);
      setPage(1);
      if (data.length === 0) {
        setError('No CVEs found for that query.');
      }
    } catch {
      setError('Unable to search CVEs right now. Check your NVD API key or internet connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-primary shadow-lg shadow-primary/5">
                <Bug size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">NVD Intelligence</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100">CVE Lookup Service</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Query the National Vulnerability Database by software, vendor, version, or CVE identifier.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Results</p>
                <p className="mt-1 text-xl font-black text-slate-100">{records.length}</p>
              </div>
              <div className="rounded-lg border border-red-900/35 bg-red-950/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400">High Risk</p>
                <p className="mt-1 text-xl font-black text-red-300">{highRiskCount}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 sm:col-span-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary">Source</p>
                <p className="mt-1 text-sm font-black text-slate-100">NVD API</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]" onSubmit={onSubmit}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
              <Input name="query" placeholder="Search: openssl, windows server 2022, nginx, CVE-2024-..." required className="h-12 pl-10 text-sm" />
            </div>
            <Button disabled={loading} className="h-12">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Searching
                </span>
              ) : (
                'Search'
              )}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {['openssl', 'windows', 'nginx', 'apache'].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-[11px] font-bold text-slate-400 transition hover:border-primary/40 hover:text-primary"
                onClick={(event) => {
                  const form = event.currentTarget.closest('div')?.previousElementSibling as HTMLFormElement | null;
                  const input = form?.querySelector<HTMLInputElement>('input[name="query"]');
                  if (input) {
                    input.value = item;
                    form?.requestSubmit();
                  }
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              <p className="font-medium">{error}</p>
            </div>
          )}
          {!loading && records.length === 0 && !error && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold text-slate-500">Search by product name, software version, or vulnerability identifier.</p>
            </div>
          )}
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="animate-pulse">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-5 w-36 rounded bg-slate-800" />
                <div className="h-6 w-24 rounded-full bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-800/80" />
                <div className="h-3 w-11/12 rounded bg-slate-800/70" />
                <div className="h-3 w-2/3 rounded bg-slate-800/60" />
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {!loading && visibleRecords.map((record) => (
        <Card key={record.id} className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden p-0 duration-300">
          <div className="grid gap-0 lg:grid-cols-[10rem_minmax(0,1fr)]">
            <div className={clsx(
              'flex flex-col justify-between border-b border-slate-800 p-4 lg:border-b-0 lg:border-r',
              record.severity === 'CRITICAL' && 'bg-red-950/25',
              record.severity === 'HIGH' && 'bg-orange-950/20',
              record.severity === 'MEDIUM' && 'bg-yellow-950/15',
              !['CRITICAL', 'HIGH', 'MEDIUM'].includes(record.severity) && 'bg-slate-950/45',
            )}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Identifier</p>
                <p className="mt-1 break-words text-sm font-black text-slate-100">{record.cveId}</p>
              </div>
              <span className={clsx(
                'mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide',
                record.severity === 'CRITICAL' && 'border-danger/45 bg-red-500/10 text-red-400',
                record.severity === 'HIGH' && 'border-warning/45 bg-orange-500/10 text-warning',
                record.severity === 'MEDIUM' && 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
                (record.severity === 'LOW' || record.severity === 'INFO') && 'border-teal-500/30 bg-teal-500/10 text-primary',
                (record.severity === 'Unknown' || !record.severity) && 'border-slate-700/50 bg-slate-800/40 text-slate-400',
              )}>
                {['CRITICAL', 'HIGH'].includes(record.severity) ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                {record.severity || 'Unknown'} {record.cvssScore !== null && `(${record.cvssScore})`}
              </span>
            </div>

            <div className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Vulnerability Record</p>
                {record.publishedDate && (
                  <span className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    Published {new Date(record.publishedDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">{record.description}</p>
              {record.referenceUrl && (
                <a
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/15 hover:text-emerald-300"
                  href={record.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={13} />
                  View NVD Reference Details
                </a>
              )}
            </div>
          </div>
        </Card>
      ))}

      {records.length > pageSize && (
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/65 p-4 text-xs">
          <span className="text-slate-400 font-medium">Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-8 text-[11px]">Previous</Button>
            <Button variant="ghost" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="h-8 text-[11px]">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

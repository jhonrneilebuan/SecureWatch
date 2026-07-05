import { FormEvent, useState } from 'react';
import { Bug, ExternalLink } from 'lucide-react';
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
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Bug size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold">CVE Lookup Service</h2>
            <p className="text-xs text-slate-500">Query the National Vulnerability Database (NVD) by software or vendor keyword to identify security vulnerabilities.</p>
          </div>
        </div>
        <form className="mt-4 flex flex-col sm:flex-row gap-3" onSubmit={onSubmit}>
          <Input name="query" placeholder="e.g. openssl, windows, nginx, apache" required className="flex-1" />
          <Button disabled={loading}>{loading ? 'Searching Vulnerabilities...' : 'Search'}</Button>
        </form>
        {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}
        {!loading && records.length === 0 && !error && (
          <p className="mt-4 text-xs text-slate-500 font-medium">Search by product name, software version, or vulnerability identifier.</p>
        )}
      </Card>
      
      {visibleRecords.map((record) => (
        <Card key={record.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/60 pb-3 mb-3">
            <span className="font-bold text-md text-slate-100">{record.cveId}</span>
            <span className={clsx(
              "text-[10px] font-extrabold px-3 py-1 rounded-full border tracking-wide uppercase",
              record.severity === 'CRITICAL' && "bg-red-500/10 border-danger/45 text-red-400",
              record.severity === 'HIGH' && "bg-orange-500/10 border-warning/45 text-warning",
              record.severity === 'MEDIUM' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
              (record.severity === 'LOW' || record.severity === 'INFO') && "bg-teal-500/10 border-teal-500/30 text-primary",
              (record.severity === 'Unknown' || !record.severity) && "bg-slate-800/40 border-slate-700/50 text-slate-400"
            )}>
              {record.severity || 'Unknown'} {record.cvssScore !== null && `(${record.cvssScore})`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{record.description}</p>
          {record.referenceUrl && (
            <a
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-emerald-400 transition"
              href={record.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={12} />
              View NVD Reference Details
            </a>
          )}
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

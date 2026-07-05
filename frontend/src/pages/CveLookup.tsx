import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { CveRecord } from '../types';

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
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">CVE Lookup</h2>
        <form className="mt-4 flex gap-3" onSubmit={onSubmit}>
          <Input name="query" placeholder="openssl, windows, nginx" required />
          <Button disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {!loading && records.length === 0 && !error && <p className="mt-4 text-sm text-slate-500">Search by product, vendor, or software keyword.</p>}
      </Card>
      {visibleRecords.map((record) => (
        <Card key={record.id}>
          <p className="font-semibold">{record.cveId} <span className={record.severity === 'CRITICAL' ? 'text-red-400' : record.severity === 'HIGH' ? 'text-warning' : 'text-primary'}>{record.severity}</span></p>
          <p className="mt-2 text-sm text-slate-400">{record.description}</p>
          {record.referenceUrl && <a className="mt-3 block text-sm text-primary" href={record.referenceUrl} target="_blank">Reference</a>}
        </Card>
      ))}
      {records.length > pageSize && (
        <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
          <span className="text-slate-400">Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <Button variant="ghost" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

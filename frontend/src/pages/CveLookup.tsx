import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { CveRecord } from '../types';

export function CveLookup() {
  const [records, setRecords] = useState<CveRecord[]>([]);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const query = String(new FormData(event.currentTarget).get('query'));
    try {
      const { data } = await api.get<CveRecord[]>(`/lookups/cve?query=${encodeURIComponent(query)}`);
      setRecords(data);
    } catch {
      setError('Unable to search CVEs right now.');
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">CVE Lookup</h2>
        <form className="mt-4 flex gap-3" onSubmit={onSubmit}>
          <Input name="query" placeholder="openssl, windows, nginx" required />
          <Button>Search</Button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Card>
      {records.map((record) => (
        <Card key={record.id}>
          <p className="font-semibold">{record.cveId} <span className="text-warning">{record.severity}</span></p>
          <p className="mt-2 text-sm text-slate-400">{record.description}</p>
          {record.referenceUrl && <a className="mt-3 block text-sm text-primary" href={record.referenceUrl} target="_blank">Reference</a>}
        </Card>
      ))}
    </div>
  );
}

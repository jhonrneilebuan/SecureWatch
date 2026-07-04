import { FormEvent, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function UploadLogs() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File)) return;

    const body = new FormData();
    body.append('file', file);
    setLoading(true);
    try {
      const { data } = await api.post('/logs/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data.threatDetected ? `${data.threatType} detected from ${data.sourceIp}` : 'No threat detected in uploaded log.');
    } catch {
      setResult('Upload failed. Verify the backend and security engine are running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <UploadCloud className="text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Upload Logs</h2>
          <p className="text-sm text-slate-500">Send system logs to the security engine for brute-force detection.</p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <input name="file" type="file" accept=".log,.txt" className="w-full rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400" required />
        <Button disabled={loading}>{loading ? 'Analyzing...' : 'Analyze Log'}</Button>
      </form>
      {result && <p className="mt-5 rounded-md border border-slate-800 bg-slate-900 p-4 text-sm">{result}</p>}
    </Card>
  );
}

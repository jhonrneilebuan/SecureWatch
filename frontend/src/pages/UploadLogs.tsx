import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { clsx } from 'clsx';

export function UploadLogs() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [threatDetected, setThreatDetected] = useState<boolean | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || !file.name) return;

    const body = new FormData();
    body.append('file', file);
    setLoading(true);
    setResult('');
    setThreatDetected(null);

    try {
      const { data } = await api.post('/logs/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setThreatDetected(data.threatDetected);
      setResult(data.threatDetected ? `${data.threatType} detected from ${data.sourceIp}` : 'No threat detected in uploaded log.');
    } catch {
      setThreatDetected(null);
      setResult('Upload failed. Verify the backend and security engine are running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <UploadCloud size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Upload Logs</h2>
          <p className="text-xs text-slate-500">Send system logs to the security engine for brute-force and vulnerability scanning.</p>
        </div>
      </div>
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed border-slate-800/90 bg-slate-950/25 px-4 py-3 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UploadCloud size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-200">
                {selectedFileName || 'No log file selected'}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Accepted: .log, .txt</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/15">
            Choose File
          </span>
          <input
            name="file"
            type="file"
            accept=".log,.txt"
            className="hidden"
            required
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFileName(file.name);
              }
            }}
          />
        </label>
        <Button disabled={loading} className="min-w-36 px-6 py-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Analyzing...
            </span>
          ) : (
            'Analyze Log'
          )}
        </Button>
      </form>
      {result && (
        <div
          className={clsx(
            'mt-6 rounded-xl border p-4 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg',
            threatDetected === true && 'border-danger/35 bg-danger/10 text-red-300 shadow-danger/10',
            threatDetected === false && 'border-primary/35 bg-primary/10 text-emerald-300 shadow-primary/10',
            threatDetected === null && 'border-slate-800 bg-slate-900/60 text-slate-300',
          )}
        >
          {threatDetected === true && <AlertCircle className="shrink-0 mt-0.5 text-danger animate-pulse" size={18} />}
          {threatDetected === false && <CheckCircle2 className="shrink-0 mt-0.5 text-primary" size={18} />}
          <div>
            <p className="font-semibold uppercase tracking-wider text-xs">{threatDetected === true ? 'Threat Alert Triggered' : threatDetected === false ? 'Telemetry Clean' : 'Status'}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-95">{result}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

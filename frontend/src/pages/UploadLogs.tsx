import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
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
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800/90 hover:border-primary/40 bg-slate-950/20 rounded-xl p-10 cursor-pointer transition-all duration-300 group">
          <UploadCloud className="text-slate-500 group-hover:text-primary transition-all duration-300" size={40} />
          <span className="mt-3 text-sm text-slate-300 font-semibold group-hover:text-slate-100 transition">
            {selectedFileName ? 'Change selected log' : 'Select log file (.log, .txt)'}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {selectedFileName ? `Selected: ${selectedFileName}` : 'Drag & drop or browse from local filesystem'}
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
        <Button disabled={loading} className="px-6 py-2">
          {loading ? 'Analyzing Telemetry...' : 'Analyze Log'}
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

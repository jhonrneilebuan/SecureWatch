import { useState } from 'react';
import { FileDown, FileText, ShieldCheck, Download } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function Reports() {
  const [downloading, setDownloading] = useState(false);
  const [options, setOptions] = useState({
    includeTelemetry: true,
    includeIncidents: true,
    includeAuditLogs: true,
  });

  async function download() {
    setDownloading(true);
    try {
      const response = await api.get('/reports/security-summary.pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'securewatch-report.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export security report', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 max-w-5xl">
      <Card className="lg:col-span-2">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Reports Console</h2>
            <p className="text-xs text-slate-500">Compile and export administrative SOC security summaries and executive reports.</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-800/80 pt-6">
          <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Report Configuration</h3>
          
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/10 hover:border-slate-700/60 cursor-pointer transition-all duration-200">
            <input
              type="checkbox"
              checked={options.includeTelemetry}
              onChange={(e) => setOptions({ ...options, includeTelemetry: e.target.checked })}
              className="mt-1 accent-primary h-4 w-4 rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary/20 focus:ring-offset-0"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Security Telemetry & Metrics</p>
              <p className="text-xs text-slate-500 mt-0.5">Include total attacks timeline graphs, malicious IP distribution, and vulnerability CVE records.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/10 hover:border-slate-700/60 cursor-pointer transition-all duration-200">
            <input
              type="checkbox"
              checked={options.includeIncidents}
              onChange={(e) => setOptions({ ...options, includeIncidents: e.target.checked })}
              className="mt-1 accent-primary h-4 w-4 rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary/20 focus:ring-offset-0"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Incident Management Logs</p>
              <p className="text-xs text-slate-500 mt-0.5">Include a detailed summary of high/critical priority incidents, current statuses, and resolution notes.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/10 hover:border-slate-700/60 cursor-pointer transition-all duration-200">
            <input
              type="checkbox"
              checked={options.includeAuditLogs}
              onChange={(e) => setOptions({ ...options, includeAuditLogs: e.target.checked })}
              className="mt-1 accent-primary h-4 w-4 rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary/20 focus:ring-offset-0"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Administrative Audit History</p>
              <p className="text-xs text-slate-500 mt-0.5">Include console operation audit trails, log scanner uploads, and system role updates.</p>
            </div>
          </label>
        </div>

        <Button
          className="mt-6 px-6"
          disabled={downloading || (!options.includeTelemetry && !options.includeIncidents && !options.includeAuditLogs)}
          onClick={download}
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mr-2" />
              Generating PDF Summary...
            </>
          ) : (
            <>
              <FileDown size={16} className="mr-1.5" />
              Export Executive Report PDF
            </>
          )}
        </Button>
      </Card>

      <Card className="flex flex-col items-center justify-center p-8 bg-slate-950/20 border-slate-850 hover:shadow-primary/5 transition-all duration-300">
        <div className="relative flex h-24 w-20 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 shadow-inner group">
          <FileText size={42} className="text-slate-500 group-hover:text-primary transition-colors duration-300" />
          <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1 text-slate-950 shadow-md">
            <ShieldCheck size={14} />
          </div>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-200 uppercase tracking-wider">Report Preview</p>
        <p className="mt-1 text-xs text-slate-500 text-center leading-normal max-w-[200px]">
          Generates a certified executive report containing authenticated SOC telemetry.
        </p>
        <div className="mt-6 border-t border-slate-800/80 pt-4 w-full text-center text-[10px] text-slate-550 uppercase tracking-widest font-mono">
          SECUREWATCH SYSTEM
        </div>
      </Card>
    </div>
  );
}

import { FileDown } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function Reports() {
  async function download() {
    const response = await api.get('/reports/security-summary.pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'securewatch-report.pdf';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="text-xl font-semibold">Reports</h2>
      <p className="mt-2 text-sm text-slate-500">Generate a PDF security summary with dashboard totals, incident status, and recommendations.</p>
      <Button className="mt-5" onClick={download}><FileDown size={16} /> Export PDF</Button>
    </Card>
  );
}

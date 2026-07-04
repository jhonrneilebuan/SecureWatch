import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress: string;
  timestamp: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => { api.get<AuditLog[]>('/auditlogs').then(({ data }) => setLogs(data)).catch(() => setLogs([])); }, []);

  return (
    <Card>
      <h2 className="mb-4 text-xl font-semibold">Audit Logs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-3">Action</th><th>Entity</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-800">
                <td className="py-3">{log.action}</td><td>{log.entityType}</td><td>{log.ipAddress || '-'}</td><td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

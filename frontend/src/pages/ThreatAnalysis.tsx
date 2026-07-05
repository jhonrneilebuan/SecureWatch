import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Threat } from '../types';

export function ThreatAnalysis() {
  const [threats, setThreats] = useState<Threat[]>([]);

  useEffect(() => {
    api.get<Threat[]>('/threats').then(({ data }) => setThreats(data)).catch(() => setThreats([]));
  }, []);

  return (
    <div className="space-y-4">
      {threats.length === 0 && <Card><p className="text-slate-400">No threats detected yet.</p></Card>}
      {threats.map((threat) => (
        <Card key={threat.id}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-semibold">{threat.threatType}</p>
              <p className="mt-1 text-sm text-slate-400">{threat.description}</p>
              <p className="mt-3 text-sm text-primary">{threat.recommendation}</p>
              <Link to={`/threats/${threat.id}`} className="mt-3 inline-block text-sm text-primary">View details</Link>
              {threat.aiImpact && <p className="mt-2 text-sm text-slate-400">Impact: {threat.aiImpact}</p>}
            </div>
            <div className="text-sm text-slate-400">
              <p>Severity: <span className="text-warning">{threat.severity}</span></p>
              <p>Source IP: {threat.sourceIP}</p>
              <p>Failed Attempts: {threat.failedAttempts}</p>
              <p>Risk Score: {threat.riskScore}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

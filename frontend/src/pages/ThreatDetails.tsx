import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Threat } from '../types';

export function ThreatDetails() {
  const { id } = useParams();
  const [threat, setThreat] = useState<Threat | null>(null);

  useEffect(() => {
    if (id) api.get<Threat>(`/threats/${id}`).then(({ data }) => setThreat(data)).catch(() => setThreat(null));
  }, [id]);

  if (!threat) return <Card><p className="text-slate-400">Threat not found.</p></Card>;

  return (
    <Card>
      <h2 className="text-xl font-semibold">{threat.threatType}</h2>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <p>Severity: {threat.severity}</p>
        <p>Risk Score: {threat.riskScore}</p>
        <p>Source IP: {threat.sourceIP}</p>
        <p>Failed Attempts: {threat.failedAttempts}</p>
      </div>
      <p className="mt-5 text-slate-300">{threat.description}</p>
      <p className="mt-4 text-primary">{threat.recommendation}</p>
      {threat.aiPreventionSteps && <p className="mt-4 text-sm text-slate-400">{threat.aiPreventionSteps}</p>}
    </Card>
  );
}

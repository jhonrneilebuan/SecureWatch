import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Incident } from '../types';

export function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const load = () => api.get<Incident[]>('/incidents').then(({ data }) => setIncidents(data)).catch(() => setIncidents([]));

  useEffect(() => { load(); }, []);

  async function resolve(id: string) {
    await api.put(`/incidents/${id}`, { status: 'Resolved', assignedTo: null });
    load();
  }

  return (
    <div className="space-y-4">
      {incidents.length === 0 && <Card><p className="text-slate-400">No active incidents yet. High and Critical threats create incidents automatically.</p></Card>}
      {incidents.map((incident) => (
        <Card key={incident.id}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">{incident.title}</p>
              <p className="mt-1 text-sm text-slate-400">{incident.description}</p>
              <p className="mt-2 text-sm text-slate-500">Priority: {incident.priority} | Status: {incident.status}</p>
            </div>
            {incident.status !== 'Resolved' && <Button onClick={() => resolve(incident.id)}>Mark Resolved</Button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

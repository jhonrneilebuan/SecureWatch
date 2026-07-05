import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

interface IncidentDetail {
  id: string;
  threatId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  notes: { id: string; note: string; createdAt: string }[];
}

export function IncidentDetails() {
  const { id } = useParams();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);

  const load = () => {
    if (id) api.get<IncidentDetail>(`/incidents/${id}`).then(({ data }) => setIncident(data)).catch(() => setIncident(null));
  };

  useEffect(load, [id]);

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get('note'));
    await api.post(`/incidents/${id}/notes`, { note });
    event.currentTarget.reset();
    load();
  }

  if (!incident) return <Card><p className="text-slate-400">Incident not found.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">{incident.title}</h2>
        <p className="mt-2 text-sm text-slate-400">{incident.description}</p>
        <p className="mt-3 text-sm">Priority: {incident.priority} | Status: {incident.status}</p>
      </Card>
      <Card>
        <h3 className="mb-4 font-semibold">Investigation Notes</h3>
        <form className="mb-4 flex gap-3" onSubmit={addNote}>
          <Input name="note" placeholder="Add investigation note" required />
          <Button>Add</Button>
        </form>
        <div className="space-y-2">
          {incident.notes.map((note) => (
            <div key={note.id} className="rounded-md border border-slate-800 p-3 text-sm">
              <p>{note.note}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

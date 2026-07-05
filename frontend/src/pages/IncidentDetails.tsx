import { FormEvent, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertTriangle, Calendar, ClipboardList } from 'lucide-react';
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

  if (!incident) {
    return (
      <Card className="text-center py-10">
        <AlertTriangle size={32} className="mx-auto text-danger mb-3" />
        <p className="text-sm font-semibold text-slate-300">Incident details not found.</p>
        <Link to="/incidents" className="mt-4 inline-block">
          <Button variant="ghost" className="text-xs">
            <ArrowLeft size={12} className="mr-1" /> Back to Incidents
          </Button>
        </Link>
      </Card>
    );
  }

  const isCritical = incident.priority === 'Critical';
  const isHigh = incident.priority === 'High';
  const isResolved = incident.status === 'Resolved';

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/incidents" className="inline-block">
        <Button variant="ghost" className="h-9 px-3 text-xs">
          <ArrowLeft size={14} className="mr-1.5" /> Back to Incidents
        </Button>
      </Link>

      <Card
        className={`border-l-4 ${
          isResolved ? 'border-l-slate-800' :
          isCritical ? 'border-l-danger' :
          isHigh ? 'border-l-warning' :
          'border-l-primary'
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
            isCritical ? 'bg-red-950/50 text-red-400 border-red-900/50' :
            isHigh ? 'bg-orange-950/50 text-orange-400 border-orange-900/50' :
            'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
          }`}>
            {incident.priority} Priority
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
            isResolved ? 'bg-emerald-950/45 text-emerald-400 border-emerald-900/40' :
            'bg-rose-950/45 text-rose-400 border-rose-900/40 animate-pulse'
          }`}>
            {incident.status}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-3">{incident.title}</h2>
        <p className="mt-2 text-sm text-slate-350 leading-relaxed font-medium">{incident.description}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-5">
          <ClipboardList size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Investigation & Resolution Timeline</h3>
        </div>

        <form className="mb-6 flex gap-3" onSubmit={addNote}>
          <Input name="note" placeholder="Add custom analyst notes or updates..." required className="flex-1" />
          <Button className="shrink-0 text-xs">Add Update</Button>
        </form>

        <div className="relative pl-6 border-l border-slate-800 space-y-6 ml-2">
          {incident.notes.map((note) => (
            <div key={note.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[30px] top-1.5 h-2 w-2 rounded-full bg-slate-700 group-hover:bg-primary border border-slate-950 transition-colors duration-200" />
              
              <div className="rounded-xl bg-slate-900/30 border border-slate-800/60 p-4 transition-colors duration-200 hover:border-slate-800">
                <p className="text-sm text-slate-200 leading-relaxed">{note.note}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                  <Calendar size={11} />
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}

          {incident.notes.length === 0 && (
            <div className="text-center py-6">
              <MessageSquare size={24} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 font-semibold uppercase">No investigation entries logged yet.</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Use the input form above to record logs, comments, or resolution activities.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

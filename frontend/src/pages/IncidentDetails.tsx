import { FormEvent, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertTriangle, Calendar, ClipboardList, Paperclip, UserCheck } from 'lucide-react';
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
  assignedTo?: string;
  resolutionNotes: string;
  notes: { id: string; note: string; createdAt: string }[];
  evidence: { id: string; title: string; evidenceType: string; reference: string; createdAt: string }[];
  timeline: { type: string; message: string; createdAt: string }[];
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

  async function updateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.put(`/incidents/${id}`, {
      status: String(form.get('status')),
      assignedTo: String(form.get('assignedTo')) || null,
      resolutionNotes: String(form.get('resolutionNotes') || ''),
    });
    load();
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.post(`/incidents/${id}/evidence`, {
      title: String(form.get('title')),
      evidenceType: String(form.get('evidenceType')),
      reference: String(form.get('reference')),
    });
    event.currentTarget.reset();
    load();
  }

  async function addEvidenceFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.post(`/incidents/${id}/evidence-file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
          <UserCheck size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Case Assignment & Resolution</h3>
        </div>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={updateCase}>
          <Input name="assignedTo" defaultValue={incident.assignedTo ?? ''} placeholder="Assignee user ID optional" />
          <select
            name="status"
            defaultValue={incident.status}
            className="h-10 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="Open" className="bg-slate-950">Open</option>
            <option value="Investigating" className="bg-slate-950">Investigating</option>
            <option value="Resolved" className="bg-slate-950">Resolved</option>
            <option value="Closed" className="bg-slate-950">Closed</option>
          </select>
          <Input name="resolutionNotes" defaultValue={incident.resolutionNotes} placeholder="Resolution notes" className="md:col-span-1" />
          <Button className="h-10 text-xs">Update Case</Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-5">
          <Paperclip size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Evidence References</h3>
        </div>
        <form className="mb-5 grid gap-3 md:grid-cols-4" onSubmit={addEvidence}>
          <Input name="title" placeholder="Evidence title" required />
          <Input name="evidenceType" placeholder="Type: log, screenshot, URL" defaultValue="Log Reference" />
          <Input name="reference" placeholder="Path, URL, hash, or note" required className="md:col-span-1" />
          <Button className="h-10 text-xs">Add Evidence</Button>
        </form>
        <form className="mb-5 grid gap-3 md:grid-cols-4" onSubmit={addEvidenceFile}>
          <Input name="title" placeholder="Attachment title optional" />
          <Input name="file" type="file" required className="md:col-span-2" />
          <Button className="h-10 text-xs">Upload File</Button>
        </form>
        {incident.evidence.length === 0 ? (
          <p className="text-xs text-slate-500">No evidence references attached yet.</p>
        ) : (
          <div className="space-y-2">
            {incident.evidence.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-200">{item.title}</p>
                  <span className="rounded border border-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{item.evidenceType}</span>
                </div>
                <p className="mt-1 break-all font-mono text-xs text-primary">{item.reference}</p>
              </div>
            ))}
          </div>
        )}
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
          {(incident.timeline.length ? incident.timeline : incident.notes.map((note) => ({ type: 'Note', message: note.note, createdAt: note.createdAt }))).map((item, index) => (
            <div key={`${item.type}-${item.createdAt}-${index}`} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[30px] top-1.5 h-2 w-2 rounded-full bg-slate-700 group-hover:bg-primary border border-slate-950 transition-colors duration-200" />
              
              <div className="rounded-xl bg-slate-900/30 border border-slate-800/60 p-4 transition-colors duration-200 hover:border-slate-800">
                <span className="mb-2 inline-block rounded border border-slate-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">{item.type}</span>
                <p className="text-sm text-slate-200 leading-relaxed">{item.message}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                  <Calendar size={11} />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}

          {incident.notes.length === 0 && incident.evidence.length === 0 && (
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

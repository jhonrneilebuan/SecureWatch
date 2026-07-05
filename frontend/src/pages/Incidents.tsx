import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Clock, ArrowRight } from 'lucide-react';
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
      <div className="mb-4">
        <h2 className="text-xl font-bold">Active Incident Management</h2>
        <p className="text-xs text-slate-500">Track and respond to automated incidents triggered by high or critical severity telemetry.</p>
      </div>

      {incidents.length === 0 && (
        <Card className="text-center py-10">
          <CheckCircle size={32} className="mx-auto text-primary mb-3" />
          <p className="text-sm font-semibold text-slate-300">No active incidents recorded.</p>
          <p className="text-xs text-slate-500 mt-1">High and critical severity threats will automatically trigger incidents here.</p>
        </Card>
      )}

      {incidents.map((incident) => {
        const isCritical = incident.priority === 'Critical';
        const isHigh = incident.priority === 'High';
        const isResolved = incident.status === 'Resolved';

        return (
          <Card
            key={incident.id}
            className={`border-l-4 transition-all duration-300 ${
              isResolved ? 'border-l-slate-800' :
              isCritical ? 'border-l-danger hover:border-danger/40' :
              isHigh ? 'border-l-warning hover:border-warning/40' :
              'border-l-primary hover:border-primary/40'
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isCritical ? 'bg-red-950/50 text-red-400 border-red-900/50' :
                    isHigh ? 'bg-orange-950/50 text-orange-400 border-orange-900/50' :
                    'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
                  }`}>
                    {incident.priority} Priority
                  </span>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    isResolved
                      ? 'bg-emerald-950/45 text-emerald-400 border-emerald-900/40'
                      : 'bg-rose-950/45 text-rose-400 border-rose-900/40 animate-pulse'
                  }`}>
                    {isResolved ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {incident.status}
                  </span>
                </div>

                <h3 className={`text-lg font-bold text-slate-200 ${isResolved ? 'line-through opacity-60' : ''}`}>
                  {incident.title}
                </h3>
                <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{incident.description}</p>
                
                <Link
                  to={`/incidents/${incident.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-400 transition pt-1"
                >
                  View Investigation Details
                  <ArrowRight size={12} />
                </Link>
              </div>

              {incident.status !== 'Resolved' && (
                <Button
                  onClick={() => resolve(incident.id)}
                  className="sm:self-center self-start text-xs font-bold h-9 shrink-0"
                >
                  Mark Resolved
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

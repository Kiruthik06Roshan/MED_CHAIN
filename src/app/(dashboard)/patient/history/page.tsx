'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getMedicalHistory } from '@/services/patient';
import type { Encounter } from '@/types/patient';
import { Clock, ChevronDown, ChevronUp, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMedicalHistory().then(setEncounters).finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const typeColors: Record<string, string> = {
    visit: 'bg-blue-100 text-blue-700',
    test: 'bg-emerald-100 text-emerald-700',
    procedure: 'bg-purple-100 text-purple-700',
    consultation: 'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      <PageHeader title="Medical History" description="Timeline of your clinical encounters and procedures." />

      {loading ? <LoadingSpinner className="py-12" /> :
        encounters.length === 0 ? (
          <EmptyState icon={Clock} title="No medical history"
            description="Your medical history will appear here as records are added." />
        ) : (
          <div className="space-y-3">
            {encounters.map(enc => (
              <div key={enc.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(enc.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{enc.provider}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(enc.date), 'MMMM d, yyyy')}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[enc.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {enc.type}
                    </span>
                  </div>
                  {expanded.has(enc.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expanded.has(enc.id) && (
                  <div className="px-6 pb-4 border-t border-border bg-secondary/10">
                    {enc.notes && <p className="text-sm text-muted-foreground mt-3">{enc.notes}</p>}
                    {enc.diagnoses && enc.diagnoses.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Diagnoses</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {enc.diagnoses.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                    )}
                    {enc.procedures && enc.procedures.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Procedures</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {enc.procedures.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

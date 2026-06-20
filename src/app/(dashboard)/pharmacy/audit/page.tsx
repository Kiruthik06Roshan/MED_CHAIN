'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type { AuditEvent } from '@/types';
import { BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function PharmacyAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pharmacy/audit').then(r => r.ok ? r.json() : []).then(setEvents).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Pharmacy Audit Log"
        description="All verification attempts, dispense events, and data access for compliance." />
      {loading ? <LoadingSpinner className="py-12" /> :
        events.length === 0 ? (
          <EmptyState icon={BookOpen} title="No audit events" description="No pharmacy audit events recorded yet." />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map(evt => (
                  <tr key={evt.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(evt.timestamp), 'MMM d, HH:mm')}</td>
                    <td className="px-4 py-3 text-xs">{evt.action}</td>
                    <td className="px-4 py-3 font-mono text-xs">{evt.targetId.slice(0, 8)}…</td>
                    <td className={`px-4 py-3 text-xs font-medium capitalize ${evt.result === 'success' ? 'text-emerald-600' : evt.result === 'denied' ? 'text-amber-600' : 'text-destructive'}`}>
                      {evt.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

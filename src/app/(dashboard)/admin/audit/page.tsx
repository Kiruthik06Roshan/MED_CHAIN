'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getAdminAuditLog } from '@/services/admin';
import type { AuditEvent } from '@/types';
import { Database } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getAdminAuditLog().then(setEvents).finally(() => setLoading(false)); }, []);

  const resultColor = { success: 'text-emerald-600', failure: 'text-destructive', denied: 'text-amber-600' };

  return (
    <div>
      <PageHeader title="System Audit Log"
        description="Complete log of all system events, data access, and admin actions."
        actions={
          <button className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
            Export
          </button>
        }
      />
      {loading ? <LoadingSpinner className="py-12" /> :
        events.length === 0 ? (
          <EmptyState icon={Database} title="No audit events" description="No events have been recorded yet." />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium">Actor</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Target</th>
                  <th className="text-left px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map(evt => (
                  <tr key={evt.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {format(new Date(evt.timestamp), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{evt.actorId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground text-xs">{evt.actorRole.toLowerCase()}</td>
                    <td className="px-4 py-3 text-xs">{evt.action}</td>
                    <td className="px-4 py-3 font-mono text-xs">{evt.targetId.slice(0, 8)}…</td>
                    <td className={`px-4 py-3 font-medium capitalize text-xs ${resultColor[evt.result]}`}>{evt.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

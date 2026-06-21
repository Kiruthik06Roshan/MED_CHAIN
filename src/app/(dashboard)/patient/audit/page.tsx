'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAuditLog } from '@/services/patient';
import type { AuditEvent } from '@/types';
import { ListOrdered, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { formatAddress, getExplorerUrl } from '@/utils/blockchain';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getAuditLog().then(setEvents).finally(() => setLoading(false)); }, []);

  const resultColor = { success: 'text-emerald-600', failure: 'text-destructive', denied: 'text-amber-600' };

  return (
    <div>
      <PageHeader title="Audit Logs"
        description="Complete log of all access events to your health data."
        actions={
          <button className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
            Export CSV
          </button>
        }
      />

      {loading ? <LoadingSpinner className="py-12" /> :
        events.length === 0 ? (
          <EmptyState icon={ListOrdered} title="No audit events"
            description="No data access events have been recorded yet." />
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium">Actor</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Scope</th>
                  <th className="text-left px-4 py-3 font-medium">Result</th>
                  <th className="text-left px-4 py-3 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map(evt => (
                  <tr key={evt.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(evt.timestamp), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{formatAddress(evt.actorId)}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{evt.actorRole.toLowerCase()}</td>
                    <td className="px-4 py-3">{evt.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{evt.scope.join(', ')}</td>
                    <td className={`px-4 py-3 font-medium capitalize ${resultColor[evt.result]}`}>{evt.result}</td>
                    <td className="px-4 py-3">
                      {evt.txHash && (
                        <a href={getExplorerUrl(evt.txHash)} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />
                          {formatAddress(evt.txHash)}
                        </a>
                      )}
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

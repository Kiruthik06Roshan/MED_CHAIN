'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getConsentRequests } from '@/services/hospital';
import type { ConsentRequest } from '@/types/consent';
import { ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  denied: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

export default function ConsentRequestsPage() {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getConsentRequests().then(setRequests).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <PageHeader title="Consent Requests" description="Track the status of patient access requests sent by your organization." />
      {loading ? <LoadingSpinner className="py-12" /> :
        requests.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No consent requests"
            description="No consent requests have been sent yet." />
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-white border border-border rounded-xl p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">Patient ID: {req.requestorId.slice(0, 8)}…</p>
                  <p className="text-sm text-muted-foreground mt-1">Purpose: {req.purpose}</p>
                  <p className="text-sm text-muted-foreground">Scope: {req.scope.join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested {format(new Date(req.createdAt), 'MMM d, yyyy')} · Expires {format(new Date(req.expiryDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

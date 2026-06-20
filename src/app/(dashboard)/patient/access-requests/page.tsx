'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAccessRequests, approveAccessRequest, denyAccessRequest } from '@/services/patient';
import type { ConsentRequest } from '@/types/consent';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => getAccessRequests().then(setRequests).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handle = async (id: string, action: 'approve' | 'deny') => {
    setActing(id);
    try {
      action === 'approve' ? await approveAccessRequest(id) : await denyAccessRequest(id);
      setRequests(r => r.filter(x => x.id !== id));
    } finally {
      setActing(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const past = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      <PageHeader title="Access Requests"
        description="Review and respond to data access requests from healthcare providers." />

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <h2 className="text-base font-semibold mb-3">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <EmptyState icon={UserCheck} title="No pending requests"
              description="No providers are currently requesting access to your data." className="mb-6" />
          ) : (
            <div className="space-y-4 mb-8">
              {pending.map(req => (
                <div key={req.id} className="bg-white border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{req.requestorName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{req.requestorRole.toLowerCase()}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="font-medium">Purpose:</span> {req.purpose}</p>
                        <p><span className="font-medium">Data Scope:</span> {req.scope.join(', ')}</p>
                        <p><span className="font-medium">Expires:</span> {format(new Date(req.expiryDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => handle(req.id, 'approve')} disabled={acting === req.id}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button onClick={() => handle(req.id, 'deny')} disabled={acting === req.id}
                        className="flex items-center gap-1.5 border border-destructive text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors">
                        <XCircle className="w-4 h-4" />
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="text-base font-semibold mb-3 text-muted-foreground">Past Requests ({past.length})</h2>
              <div className="space-y-3 opacity-60">
                {past.map(req => (
                  <div key={req.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{req.requestorName}</p>
                      <p className="text-sm text-muted-foreground">{req.purpose}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getConsents, revokeConsent } from '@/services/patient';
import type { ConsentGrant } from '@/types/consent';
import { ShieldCheck, ShieldOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { formatAddress, getExplorerUrl } from '@/utils/blockchain';

export default function ConsentPage() {
  const [consents, setConsents] = useState<ConsentGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = () => getConsents().then(setConsents).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this consent? The grantee will immediately lose access.')) return;
    setRevoking(id);
    try {
      await revokeConsent(id);
      setConsents(c => c.filter(x => x.id !== id));
    } finally {
      setRevoking(null);
    }
  };

  const active = consents.filter(c => c.isActive);
  const revoked = consents.filter(c => !c.isActive);

  return (
    <div>
      <PageHeader title="Consent Center"
        description="Manage who has access to your health data and revoke access at any time." />

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <h2 className="text-base font-semibold mb-3">Active Consents ({active.length})</h2>
          {active.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No active consents"
              description="You haven't granted access to any providers." className="mb-6" />
          ) : (
            <div className="space-y-3 mb-8">
              {active.map(c => (
                <div key={c.id} className="bg-white border border-border rounded-xl p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-foreground">{c.granteeName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Purpose: {c.purpose}</p>
                    <p className="text-sm text-muted-foreground mb-1">Scope: {c.scope.join(', ')}</p>
                    <p className="text-xs text-muted-foreground">
                      Granted {format(new Date(c.grantedAt), 'MMM d, yyyy')} · Expires {format(new Date(c.expiresAt), 'MMM d, yyyy')}
                    </p>
                    {c.blockchainTxHash && (
                      <a href={getExplorerUrl(c.blockchainTxHash)} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                        <ExternalLink className="w-3 h-3" />
                        {formatAddress(c.blockchainTxHash)}
                      </a>
                    )}
                  </div>
                  <button onClick={() => handleRevoke(c.id)} disabled={revoking === c.id}
                    className="flex items-center gap-1.5 text-sm text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50">
                    <ShieldOff className="w-3.5 h-3.5" />
                    {revoking === c.id ? 'Revoking…' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {revoked.length > 0 && (
            <>
              <h2 className="text-base font-semibold mb-3 text-muted-foreground">Revoked / Expired ({revoked.length})</h2>
              <div className="space-y-3 opacity-60">
                {revoked.map(c => (
                  <div key={c.id} className="bg-white border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldOff className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">{c.granteeName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Purpose: {c.purpose}</p>
                    {c.revokedAt && <p className="text-xs text-muted-foreground mt-1">Revoked {format(new Date(c.revokedAt), 'MMM d, yyyy')}</p>}
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

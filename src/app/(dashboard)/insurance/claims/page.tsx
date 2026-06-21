'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getClaims, type Claim } from '@/services/insurance';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  verified: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-emerald-100 text-emerald-700',
  denied: 'bg-red-100 text-red-700',
};

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getClaims().then(setClaims).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <PageHeader title="Claims" description="Overview of all insurance claims." />
      {loading ? <LoadingSpinner className="py-12" /> :
        claims.length === 0 ? (
          <EmptyState icon={CreditCard} title="No claims" description="No claims have been submitted yet." />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Claim ID</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.map(c => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{c.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.patientId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-semibold">${c.claimAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(c.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
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

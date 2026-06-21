'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getPrescriptions } from '@/services/patient';
import type { Prescription } from '@/types/patient';
import type { StatusType } from '@/types';
import { Pill, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getPrescriptions().then(setPrescriptions).finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? prescriptions.filter(p => p.status === statusFilter) : prescriptions;

  return (
    <div>
      <PageHeader title="Prescriptions" description="View and manage your medication prescriptions." />

      <div className="flex gap-2 mb-4">
        {['', 'active', 'filled', 'expired'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-muted-foreground hover:bg-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-12" /> :
        filtered.length === 0 ? (
          <EmptyState icon={Pill} title="No prescriptions found"
            description="You have no prescriptions matching this filter." />
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Medication</th>
                  <th className="text-left px-4 py-3 font-medium">Prescriber</th>
                  <th className="text-left px-4 py-3 font-medium">Dosage</th>
                  <th className="text-left px-4 py-3 font-medium">Issued</th>
                  <th className="text-left px-4 py-3 font-medium">Expires</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(rx => (
                  <tr key={rx.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{rx.medication}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rx.prescriberName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rx.dosage}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(rx.dateIssued), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(rx.expiryDate), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rx.status as StatusType} />
                    </td>
                    <td className="px-4 py-3">
                      {rx.signatureProof && <CheckCircle className="w-4 h-4 text-emerald-600" />}
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

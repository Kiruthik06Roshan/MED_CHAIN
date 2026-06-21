'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getHospitalPrescriptions } from '@/services/hospital';
import type { Prescription } from '@/types/patient';
import type { StatusType } from '@/types';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function HospitalPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getHospitalPrescriptions().then(setPrescriptions).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <PageHeader title="Prescriptions Issued" description="Prescriptions created by your organization."
        actions={
          <Link href={ROUTES.HOSPITAL.PRESCRIPTIONS_NEW}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Prescription
          </Link>
        }
      />

      {loading ? <LoadingSpinner className="py-12" /> :
        prescriptions.length === 0 ? (
          <EmptyState icon={FileText} title="No prescriptions" description="No prescriptions have been created yet." />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Medication</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Date Issued</th>
                  <th className="text-left px-4 py-3 font-medium">Expiry</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prescriptions.map(rx => (
                  <tr key={rx.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{rx.medication}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rx.patientId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(rx.dateIssued), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(rx.expiryDate), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3"><StatusBadge status={rx.status as StatusType} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

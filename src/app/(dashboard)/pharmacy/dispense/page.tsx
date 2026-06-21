'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getPendingPrescriptions, dispenseMedication } from '@/services/pharmacy';
import type { Prescription } from '@/types/patient';
import { ClipboardList, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DispensePage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [dispensed, setDispensed] = useState<Set<string>>(new Set());

  useEffect(() => { getPendingPrescriptions().then(setPrescriptions).finally(() => setLoading(false)); }, []);

  const handleDispense = async (rx: Prescription) => {
    setDispensing(rx.id);
    await dispenseMedication(rx.id, rx.quantity, rx.refills - 1).catch(() => null);
    setDispensed(d => new Set(d).add(rx.id));
    setDispensing(null);
  };

  const pending = prescriptions.filter(p => !dispensed.has(p.id) && p.status === 'active');

  return (
    <div>
      <PageHeader title="Dispense Medications" description="Record dispensing for verified, eligible prescriptions." />

      {loading ? <LoadingSpinner className="py-12" /> :
        pending.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No prescriptions to dispense"
            description="All verified prescriptions have been dispensed." />
        ) : (
          <div className="space-y-4">
            {pending.map(rx => (
              <div key={rx.id} className="bg-white border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{rx.medication}</p>
                  <p className="text-sm text-muted-foreground">{rx.dosage} · {rx.quantity} units · {rx.refills} refills</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prescribed by {rx.prescriberName} on {format(new Date(rx.dateIssued), 'MMM d, yyyy')}
                  </p>
                </div>
                <button onClick={() => handleDispense(rx)} disabled={dispensing === rx.id}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {dispensing === rx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm Dispense
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

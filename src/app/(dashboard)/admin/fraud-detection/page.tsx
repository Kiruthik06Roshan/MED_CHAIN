'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface FraudAlertAdmin {
  id: string;
  patientId: string;
  fraudScore: number;
  indicator: string;
  explanation: string;
  createdAt: string;
  triagedAt: string | null;
}

export default function AdminFraudPage() {
  const [alerts, setAlerts] = useState<FraudAlertAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/fraud-alerts').then(r => r.ok ? r.json() : []).then(setAlerts).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Fraud Detection" description="Investigate and triage fraud alerts across all patients." />
      {loading ? <LoadingSpinner className="py-12" /> :
        alerts.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No fraud alerts" description="No active fraud alerts in the system." />
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${alert.fraudScore >= 70 ? 'bg-red-500' : alert.fraudScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${alert.fraudScore}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${alert.fraudScore >= 70 ? 'text-red-600' : alert.fraudScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        Score: {alert.fraudScore}/100
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">{alert.indicator}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.explanation}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Patient: {alert.patientId.slice(0, 8)}…</span>
                      <span>{format(new Date(alert.createdAt), 'MMM d, HH:mm')}</span>
                      {alert.triagedAt && <span className="text-emerald-600">Triaged</span>}
                    </div>
                  </div>
                  {!alert.triagedAt && (
                    <button className="text-sm font-medium text-primary hover:underline shrink-0">
                      Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

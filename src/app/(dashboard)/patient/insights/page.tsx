'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SeverityBadge } from '@/components/common/StatusBadge';
import { getPatientSafetyInsights, getFraudAlerts, dismissInsight } from '@/services/ai';
import type { SafetyInsight, FraudAlert } from '@/types/ai';
import { Sparkles, AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

const iconMap = { safety: ShieldAlert, warning: AlertTriangle, info: Info };

export default function InsightsPage() {
  const [insights, setInsights] = useState<SafetyInsight[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'safety' | 'fraud'>('safety');
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPatientSafetyInsights(), getFraudAlerts()])
      .then(([s, f]) => { setInsights(s); setFraudAlerts(f); })
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async (id: string) => {
    setDismissing(id);
    await dismissInsight(id).catch(() => null);
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isDismissed: true } : i));
    setDismissing(null);
  };

  const activeInsights = insights.filter(i => !i.isDismissed);

  return (
    <div>
      <PageHeader title="AI Insights"
        description="AI-powered safety analysis and anomaly detection for your health data." />

      <div className="flex gap-2 mb-6">
        {(['safety', 'fraud'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-muted-foreground hover:bg-secondary'}`}>
            {t === 'safety' ? 'Safety Insights' : 'Fraud Detection'}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${tab === t ? 'bg-primary-foreground/20' : 'bg-secondary'}`}>
              {t === 'safety' ? activeInsights.length : fraudAlerts.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          {tab === 'safety' && (
            activeInsights.length === 0 ? (
              <EmptyState icon={Sparkles} title="No safety concerns"
                description="Your AI health analysis is up to date. No active concerns found." />
            ) : (
              <div className="space-y-4">
                {activeInsights.map(ins => {
                  const Icon = iconMap[ins.type];
                  return (
                    <div key={ins.id} className={`bg-white border rounded-xl p-5 ${
                      ins.severity === 'high' ? 'border-red-200' : ins.severity === 'medium' ? 'border-amber-200' : 'border-border'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            ins.severity === 'high' ? 'bg-red-100' : ins.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              ins.severity === 'high' ? 'text-red-600' : ins.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={ins.severity} />
                              <span className="text-xs text-muted-foreground">{format(new Date(ins.timestamp), 'MMM d, HH:mm')}</span>
                            </div>
                            <p className="font-medium text-foreground mb-1">{ins.message}</p>
                            <p className="text-sm text-muted-foreground">{ins.recommendation}</p>
                            <p className="text-xs text-muted-foreground mt-2">Source: {ins.sourceModel}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDismiss(ins.id)} disabled={dismissing === ins.id}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
                          <CheckCircle className="w-4 h-4" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'fraud' && (
            fraudAlerts.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="No fraud alerts"
                description="No suspicious access patterns detected in your records." />
            ) : (
              <div className="space-y-4">
                {fraudAlerts.map(alert => (
                  <div key={alert.id} className="bg-white border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${alert.score >= 70 ? 'bg-red-500' : alert.score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${alert.score}%` }} />
                            </div>
                            <span className={`text-sm font-bold ${alert.score >= 70 ? 'text-red-600' : alert.score >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {alert.score}/100
                            </span>
                          </div>
                        </div>
                        <p className="font-semibold text-foreground mb-1">{alert.indicator}</p>
                        <p className="text-sm text-muted-foreground mb-2">{alert.explanation}</p>
                        <div className="flex flex-wrap gap-1">
                          {alert.affectedData.map(d => (
                            <span key={d} className="bg-secondary px-2 py-0.5 rounded text-xs">{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

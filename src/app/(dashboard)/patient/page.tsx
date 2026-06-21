'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardCard } from '@/components/patient/DashboardCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getPatientDashboard } from '@/services/patient';
import type { PatientDashboardStats } from '@/types/patient';
import { useAuth } from '@/hooks/useAuth';
import { Pill, ShieldCheck, UserCheck, ListOrdered, Plus, Vault, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatientDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { label: 'Health Vault', href: ROUTES.PATIENT.VAULT, icon: Vault, color: 'blue' as const },
    { label: 'Prescriptions', href: ROUTES.PATIENT.PRESCRIPTIONS, icon: Pill, color: 'green' as const },
    { label: 'Consent Center', href: ROUTES.PATIENT.CONSENT, icon: ShieldCheck, color: 'indigo' as const },
    { label: 'AI Insights', href: ROUTES.PATIENT.INSIGHTS, icon: Sparkles, color: 'amber' as const },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0] ?? 'Patient'}`}
        description="Manage your health data and privacy settings."
        actions={
          <Link href={ROUTES.PATIENT.VAULT}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Open Vault
          </Link>
        }
      />

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard
              title="Total Prescriptions"
              value={stats?.totalPrescriptions ?? 0}
              icon={Pill}
              color="blue"
            />
            <DashboardCard
              title="Active Consents"
              value={stats?.activeConsents ?? 0}
              icon={ShieldCheck}
              color="green"
            />
            <DashboardCard
              title="Pending Requests"
              value={stats?.pendingAccessRequests ?? 0}
              icon={UserCheck}
              color="amber"
            />
            <DashboardCard
              title="Audit Events (30d)"
              value={stats?.auditEventsLast30Days ?? 0}
              icon={ListOrdered}
              color="indigo"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href}
                  className="bg-white border border-border rounded-xl p-4 hover:shadow-card-hover transition-shadow flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    color === 'blue' ? 'bg-blue-50' : color === 'green' ? 'bg-emerald-50' : color === 'indigo' ? 'bg-indigo-50' : 'bg-amber-50'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-emerald-600' : color === 'indigo' ? 'text-indigo-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

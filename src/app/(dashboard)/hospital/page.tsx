'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardCard } from '@/components/patient/DashboardCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Users, FileText, ShieldCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface Stats { patients: number; pendingRequests: number; prescriptions: number; verifications: number; }

export default function HospitalDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hospital/metrics').then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Hospital Dashboard" description="Manage patients, prescriptions, and consent requests." />
      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard title="Patients Accessed" value={stats?.patients ?? 0} icon={Users} color="blue" />
            <DashboardCard title="Pending Consents" value={stats?.pendingRequests ?? 0} icon={ShieldCheck} color="amber" />
            <DashboardCard title="Prescriptions Issued" value={stats?.prescriptions ?? 0} icon={FileText} color="green" />
            <DashboardCard title="Verifications" value={stats?.verifications ?? 0} icon={CheckCircle} color="indigo" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Search Patients', href: ROUTES.HOSPITAL.PATIENTS, icon: Users },
              { label: 'Create Prescription', href: ROUTES.HOSPITAL.PRESCRIPTIONS_NEW, icon: FileText },
              { label: 'Consent Requests', href: ROUTES.HOSPITAL.CONSENT_REQUESTS, icon: ShieldCheck },
            ].map(a => (
              <Link key={a.href} href={a.href} className="bg-white border border-border rounded-xl p-6 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <a.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-semibold text-foreground">{a.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

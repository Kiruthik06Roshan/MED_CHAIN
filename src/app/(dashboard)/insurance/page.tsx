'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardCard } from '@/components/patient/DashboardCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CreditCard, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface Stats { totalClaims: number; pendingVerifications: number; approvalRate: number; fraudFlags: number; }

export default function InsuranceDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insurance/metrics').then(r => r.ok ? r.json() : { totalClaims: 0, pendingVerifications: 0, approvalRate: 0, fraudFlags: 0 })
      .then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Insurance Dashboard" description="Manage claims and medical verification requests." />
      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard title="Total Claims" value={stats?.totalClaims ?? 0} icon={CreditCard} color="blue" />
            <DashboardCard title="Pending Verifications" value={stats?.pendingVerifications ?? 0} icon={CheckCircle} color="amber" />
            <DashboardCard title="Approval Rate" value={`${stats?.approvalRate ?? 0}%`} icon={FileText} color="green" />
            <DashboardCard title="Fraud Flags" value={stats?.fraudFlags ?? 0} icon={AlertTriangle} color="indigo" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Claims Dashboard', href: ROUTES.INSURANCE.CLAIMS, icon: CreditCard },
              { label: 'Request Verification', href: ROUTES.INSURANCE.VERIFICATION, icon: CheckCircle },
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

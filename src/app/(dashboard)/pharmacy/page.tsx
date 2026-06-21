'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardCard } from '@/components/patient/DashboardCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Search, ClipboardList, Package, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface Stats { forVerification: number; dispensedToday: number; pending: number; alerts: number; }

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pharmacy/metrics').then(r => r.ok ? r.json() : { forVerification: 0, dispensedToday: 0, pending: 0, alerts: 0 })
      .then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Pharmacy Dashboard" description="Manage prescription verification and dispensing." />
      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard title="For Verification" value={stats?.forVerification ?? 0} icon={Search} color="amber" />
            <DashboardCard title="Dispensed Today" value={stats?.dispensedToday ?? 0} icon={CheckCircle} color="green" />
            <DashboardCard title="Pending Fills" value={stats?.pending ?? 0} icon={ClipboardList} color="blue" />
            <DashboardCard title="Alerts" value={stats?.alerts ?? 0} icon={Package} color="indigo" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Verify Prescription', href: ROUTES.PHARMACY.VERIFY, icon: Search },
              { label: 'Dispense Medication', href: ROUTES.PHARMACY.DISPENSE, icon: ClipboardList },
              { label: 'Inventory', href: ROUTES.PHARMACY.INVENTORY, icon: Package },
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

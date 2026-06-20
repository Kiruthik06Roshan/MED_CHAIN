'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardCard } from '@/components/patient/DashboardCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getDashboardMetrics, type DashboardMetrics } from '@/services/admin';
import { Users, Database, Activity, AlertTriangle, ShieldCheck, BarChart3, FileText, Pill } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(() => setError('Failed to load metrics. Check console for details.'))
      .finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { label: 'Analytics',       href: ROUTES.ADMIN.ANALYTICS,  icon: BarChart3 },
    { label: 'Monitoring',      href: ROUTES.ADMIN.MONITORING,  icon: Activity },
    { label: 'Fraud Detection', href: ROUTES.ADMIN.FRAUD,       icon: AlertTriangle },
    { label: 'User Management', href: ROUTES.ADMIN.USERS,       icon: Users },
    { label: 'Audit Log',       href: ROUTES.ADMIN.AUDIT,       icon: Database },
    { label: 'Settings',        href: ROUTES.ADMIN.SETTINGS,    icon: ShieldCheck },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide overview and health monitoring."
      />

      {loading && <LoadingSpinner className="py-12" />}

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <DashboardCard
              title="Total Users"
              value={metrics?.totalUsers ?? 0}
              icon={Users}
              color="blue"
            />
            <DashboardCard
              title="Medical Records"
              value={metrics?.totalRecords ?? 0}
              icon={Database}
              color="green"
            />
            <DashboardCard
              title="Active Prescriptions"
              value={metrics?.activePrescriptions ?? 0}
              icon={Pill}
              color="indigo"
            />
            <DashboardCard
              title="Active Consents"
              value={metrics?.activeConsents ?? 0}
              icon={ShieldCheck}
              color="green"
            />
            <DashboardCard
              title="Access Events (24h)"
              value={metrics?.accessVolume ?? 0}
              icon={Activity}
              color="indigo"
            />
            <DashboardCard
              title="Fraud Alerts Today"
              value={metrics?.fraudAlertsToday ?? 0}
              icon={AlertTriangle}
              color="amber"
            />
          </div>

          {/* Users by role breakdown */}
          {metrics?.usersByRole && Object.keys(metrics.usersByRole).length > 0 && (
            <div className="bg-white border border-border rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Users by Role
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(metrics.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{role}</span>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="bg-white border border-border rounded-xl p-5 flex items-center gap-3 hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

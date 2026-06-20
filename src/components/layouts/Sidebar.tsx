'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useRole } from '@/hooks/useRole';
import { ROUTES } from '@/constants/routes';
import {
  LayoutDashboard, Vault, FileText, Clock, ShieldCheck, UserCheck,
  ListOrdered, Sparkles, User, Users, Pill, ClipboardList, Search,
  CheckCircle, Package, FileBarChart, BarChart3, Activity, AlertTriangle,
  Settings, ChevronLeft, ChevronRight, CreditCard, BookOpen
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const patientNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.PATIENT.ROOT, icon: LayoutDashboard },
  { label: 'Health Vault', href: ROUTES.PATIENT.VAULT, icon: Vault },
  { label: 'Prescriptions', href: ROUTES.PATIENT.PRESCRIPTIONS, icon: Pill },
  { label: 'Medical History', href: ROUTES.PATIENT.HISTORY, icon: Clock },
  { label: 'Consent Center', href: ROUTES.PATIENT.CONSENT, icon: ShieldCheck },
  { label: 'Access Requests', href: ROUTES.PATIENT.ACCESS_REQUESTS, icon: UserCheck },
  { label: 'Audit Logs', href: ROUTES.PATIENT.AUDIT, icon: ListOrdered },
  { label: 'AI Insights', href: ROUTES.PATIENT.INSIGHTS, icon: Sparkles },
  { label: 'Profile', href: ROUTES.PATIENT.PROFILE, icon: User },
];

const hospitalNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.HOSPITAL.ROOT, icon: LayoutDashboard },
  { label: 'Patients', href: ROUTES.HOSPITAL.PATIENTS, icon: Users },
  { label: 'Prescriptions', href: ROUTES.HOSPITAL.PRESCRIPTIONS, icon: FileText },
  { label: 'Consent Requests', href: ROUTES.HOSPITAL.CONSENT_REQUESTS, icon: ShieldCheck },
  { label: 'Verification', href: ROUTES.HOSPITAL.VERIFICATION, icon: CheckCircle },
];

const pharmacyNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.PHARMACY.ROOT, icon: LayoutDashboard },
  { label: 'Verify Rx', href: ROUTES.PHARMACY.VERIFY, icon: Search },
  { label: 'Dispense', href: ROUTES.PHARMACY.DISPENSE, icon: ClipboardList },
  { label: 'Inventory', href: ROUTES.PHARMACY.INVENTORY, icon: Package },
  { label: 'Audit', href: ROUTES.PHARMACY.AUDIT, icon: BookOpen },
];

const insuranceNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.INSURANCE.ROOT, icon: LayoutDashboard },
  { label: 'Claims', href: ROUTES.INSURANCE.CLAIMS, icon: CreditCard },
  { label: 'Verification', href: ROUTES.INSURANCE.VERIFICATION, icon: CheckCircle },
  { label: 'Audit', href: ROUTES.INSURANCE.AUDIT, icon: ListOrdered },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN.ROOT, icon: LayoutDashboard },
  { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
  { label: 'Monitoring', href: ROUTES.ADMIN.MONITORING, icon: Activity },
  { label: 'Fraud Detection', href: ROUTES.ADMIN.FRAUD, icon: AlertTriangle },
  { label: 'Users', href: ROUTES.ADMIN.USERS, icon: Users },
  { label: 'Audit Log', href: ROUTES.ADMIN.AUDIT, icon: FileBarChart },
  { label: 'Settings', href: ROUTES.ADMIN.SETTINGS, icon: Settings },
];

const roleNavMap: Record<string, NavItem[]> = {
  PATIENT: patientNav,
  HOSPITAL: hospitalNav,
  PHARMACY: pharmacyNav,
  INSURANCE: insuranceNav,
  ADMIN: adminNav,
};

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const { role } = useRole();
  const navItems = roleNavMap[role ?? ''] ?? [];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-border shadow-sidebar z-[var(--z-sidebar)] flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border gap-3', collapsed && 'justify-center px-0')}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">M</span>
        </div>
        {!collapsed && <span className="font-bold text-lg text-primary">MedChain</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors text-sm font-medium group',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="p-3 border-t border-border">
        <button onClick={onToggle}
          className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-sm', collapsed && 'justify-center px-0')}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

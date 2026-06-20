"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRightFromLine,
  BadgeCheck,
  FileText,
  LayoutDashboard,
  History,
  Menu,
  Search,
  Settings,
  Shield,
  Pill,
  ScanLine,
  Stethoscope,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Role = "patient" | "doctor" | "pharmacy";

type SidebarProps = {
  role: Role;
  user: { name: string; email: string; avatar?: string };
};

const navigationByRole: Record<
  Role,
  Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>
> = {
  patient: [
    { label: "Vault", href: "/dashboard/patient", icon: LayoutDashboard },
    {
      label: "Access Control",
      href: "/dashboard/patient/access",
      icon: Shield,
    },
    {
      label: "Audit Logs",
      href: "/dashboard/patient/audit-logs",
      icon: History,
    },
    { label: "Settings", href: "/dashboard/patient/settings", icon: Settings },
  ],
  doctor: [
    { label: "Patients", href: "/dashboard/doctor", icon: Users },
    {
      label: "Prescriptions",
      href: "/dashboard/doctor/prescribe",
      icon: FileText,
    },
    {
      label: "Safety Checks",
      href: "/dashboard/doctor/safety",
      icon: AlertTriangle,
    },
    { label: "Settings", href: "/dashboard/doctor/settings", icon: Settings },
  ],
  pharmacy: [
    { label: "Verify Rx", href: "/dashboard/pharmacy", icon: ScanLine },
    {
      label: "Patient Lookup",
      href: "/dashboard/pharmacy/lookup",
      icon: Search,
    },
    { label: "Settings", href: "/dashboard/pharmacy/settings", icon: Settings },
  ],
};

function SidebarContent({
  role,
  user,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navigationByRole[role];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  const initials = useMemo(() => {
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user.name]);

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <Link
          href="/"
          className="text-xl font-black tracking-[0.2em] text-transparent"
          style={{
            backgroundImage: "linear-gradient(90deg, #22d3ee, #3b82f6)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          VORTEXA
        </Link>
        <p className="mt-2 text-sm text-slate-400">{role} workspace</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-l-2 px-4 py-3 text-sm transition",
                active
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge>{role}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="ml-auto text-slate-300 hover:text-white"
          >
            Logout <ArrowRightFromLine className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r border-white/10 bg-slate-900 lg:block">
        <SidebarContent {...props} />
      </aside>

      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <button className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-xl">
              <Menu className="h-4 w-4" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader>
              <SheetTitle>VORTEXA</SheetTitle>
            </SheetHeader>
            <SidebarContent {...props} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

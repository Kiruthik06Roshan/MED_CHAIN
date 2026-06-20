"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Role = "patient" | "doctor" | "pharmacy";

const roleOptions: Array<{
  role: Role;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    role: "patient",
    label: "Patient",
    description: "Control your own vault",
    icon: UserRound,
  },
  {
    role: "doctor",
    label: "Doctor",
    description: "Create safe prescriptions",
    icon: Stethoscope,
  },
  {
    role: "pharmacy",
    label: "Pharmacy",
    description: "Verify and dispense securely",
    icon: Pill,
  },
];

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [pendingRoleSelection, setPendingRoleSelection] = useState<Role | null>(
    null,
  );
  const [animatedBackground, setAnimatedBackground] = useState(false);

  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? "/dashboard",
    [searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimatedBackground(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setSessionLoading(false);
        return;
      }

      const role = session.user.user_metadata?.role as Role | undefined;
      if (!role) {
        setRoleModalOpen(true);
      } else {
        router.replace(
          callbackUrl.startsWith("/dashboard")
            ? callbackUrl
            : `/dashboard/${role}`,
        );
      }

      setSessionLoading(false);
    };

    void run();
  }, [callbackUrl, router]);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        throw error;
      }
    } catch {
      toast.error("Google sign-in failed. Try again.");
      setLoading(false);
    }
  }

  async function confirmRole(role: Role) {
    setPendingRoleSelection(role);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { role },
      });

      if (error) {
        throw error;
      }

      setRoleModalOpen(false);
      router.replace(`/dashboard/${role}`);
    } catch {
      toast.error("Could not save your role. Please try again.");
    } finally {
      setPendingRoleSelection(null);
    }
  }

  return (
    <main className="grid min-h-screen overflow-hidden bg-slate-900 lg:grid-cols-[40%_60%]">
      <motion.section
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-16 lg:border-b-0 lg:border-r"
      >
        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.2),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent)] transition-opacity duration-700 ${animatedBackground ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
        <div className="relative max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            <ShieldCheck className="h-4 w-4" />
            Patient-sovereign health network
          </div>
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 sm:text-6xl">
            VORTEXA
          </h1>
          <p className="mt-6 text-2xl font-bold text-white sm:text-3xl">
            Own Your Health Data. Cryptographically.
          </p>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300 sm:text-lg">
            Secure Google OAuth and consent-driven access for your hackathon
            build.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-center px-6 py-10 lg:px-10"
      >
        <Card className="w-full max-w-2xl border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Continue with Google</CardTitle>
            <CardDescription>
              Sign in to VORTEXA and choose your access role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessionLoading ? (
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Checking your session...
              </div>
            ) : (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {loading ? "Connecting to Google" : "Sign in with Google"}
                </Button>
                <p className="flex items-start gap-2 text-sm text-slate-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-400" />
                  After sign in, VORTEXA checks your stored role and routes you
                  accordingly.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
          <DialogContent className="max-w-3xl border-white/10 bg-slate-900/95">
            <DialogHeader>
              <DialogTitle>Select your role</DialogTitle>
              <DialogDescription>
                No role was found in your account metadata. Choose one to
                continue.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {roleOptions.map(({ role, label, description, icon: Icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-3xl border p-5 text-left transition ${selectedRole === role ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-slate-300">{description}</p>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => confirmRole(selectedRole)}
                disabled={Boolean(pendingRoleSelection)}
              >
                {pendingRoleSelection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.section>
    </main>
  );
}

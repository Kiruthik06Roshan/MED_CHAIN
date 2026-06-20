"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Ban,
  Brain,
  Key,
  Lock,
  ScanLine,
  Shield,
  ShieldCheck,
  Upload,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Patient-Owned Vault",
    description:
      "Your prescriptions and records stay under patient control with cryptographic consent flows.",
    icon: Lock,
  },
  {
    title: "AI Safety Checks",
    description:
      "Medication intelligence with interaction warnings before prescriptions are issued.",
    icon: Brain,
  },
  {
    title: "Cryptographic Consent",
    description:
      "Grant and revoke access with signed permissions and auditable logs.",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: "Upload",
    description: "Add records or prescriptions to the vault.",
    icon: Upload,
  },
  {
    title: "Grant",
    description: "Authorize a doctor or pharmacy with consent.",
    icon: Key,
  },
  {
    title: "Check",
    description: "Run AI safety checks on medication combinations.",
    icon: ScanLine,
  },
  {
    title: "Revoke",
    description: "Remove access instantly when consent expires.",
    icon: Ban,
  },
];

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <PageTransition>
      <main className="bg-slate-900 text-white">
        <section className="relative flex min-h-screen items-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%)]" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 py-24 lg:px-8">
            <div className="flex items-center gap-3 text-cyan-300">
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Shield className="h-6 w-6" />
              </motion.div>
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
                transition={{
                  duration: 4.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Activity className="h-6 w-6" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-10 max-w-4xl"
            >
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
                VORTEXA
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 sm:text-7xl lg:text-8xl">
                Own Your Health Data. Cryptographically.
              </h1>
              <p className="mt-6 max-w-2xl text-xl font-medium text-slate-300 sm:text-2xl">
                Patient-sovereign prescription intelligence network
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/auth">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-16 max-w-2xl text-sm text-slate-400"
            >
              Built for hackathon teams shipping patient-first health
              infrastructure.
            </motion.div>
          </div>
        </section>

        <section
          id="features"
          className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                >
                  <Card className="group h-full border-white/10 bg-white/5 transition duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.18)]">
                    <CardHeader>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 transition group-hover:bg-cyan-500/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                A consent flow that stays auditable.
              </h2>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-6 right-6 top-8 hidden h-px bg-gradient-to-r from-cyan-500/20 via-cyan-400/80 to-cyan-500/20 lg:block" />
            <div className="grid gap-6 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.45, delay: index * 0.12 }}
                    className="relative"
                  >
                    <Card className="relative h-full border-white/10 bg-slate-800/70">
                      <CardHeader>
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="mt-4 text-lg">
                          {step.title}
                        </CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 px-6 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-white">VORTEXA</p>
            <p>Hackathon Project 2026</p>
            <a
              className="text-cyan-300 hover:text-cyan-200"
              href="https://github.com"
            >
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </PageTransition>
  );
}

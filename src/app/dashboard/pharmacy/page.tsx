"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, ShieldCheck, History } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/sidebar";
import AiSafetyBanner from "@/components/ai-safety-banner";
import SignatureBadge from "@/components/signature-badge";
import type { SafetyCheckResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dashboardUser = {
  name: "Pharm. Eli Torres",
  email: "eli.pharmacy@vortexa.health",
};

const verifyHistory = [
  { label: "Prescription created", date: "2 days ago", status: "approved" },
  { label: "Drug interaction reviewed", date: "1 day ago", status: "warning" },
  { label: "Dispensed", date: "Today", status: "approved" },
];

const patientHistory = [
  { medication: "Metformin", dosage: "500mg", frequency: "BID", current: true },
  {
    medication: "Atorvastatin",
    dosage: "20mg",
    frequency: "Nightly",
    current: false,
  },
  {
    medication: "Amoxicillin",
    dosage: "500mg",
    frequency: "TID",
    current: false,
  },
];

const mockVerification = {
  patientName: "Avery Stone",
  doctorName: "Dr. Maya Chen",
  date: new Date(Date.now() - 1000 * 60 * 60 * 3),
  signature: "0x8b7e...4c19",
  safety: {
    status: "warning",
    message: "Minor interaction detected with current statin therapy.",
    interactions: [
      {
        drug1: "Atorvastatin",
        drug2: "Grapefruit Juice",
        severity: "warning",
        description: "Can increase statin concentration and side effects.",
      },
    ],
    confidence: 0.77,
  } satisfies SafetyCheckResult,
};

export default function PharmacyDashboard() {
  const [prescriptionId, setPrescriptionId] = useState("");
  const [verified, setVerified] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [patient, setPatient] = useState<{
    name: string;
    email: string;
    records: typeof patientHistory;
  } | null>(null);

  const currentPatient = useMemo(
    () =>
      patient ?? {
        name: "Avery Stone",
        email: "avery.patient@vortexa.health",
        records: patientHistory,
      },
    [patient],
  );

  function handleVerify() {
    if (!prescriptionId.trim()) {
      toast.error("Enter a prescription ID.");
      return;
    }

    setVerified(true);
    toast.success("Prescription verified.");
  }

  function handleLookup() {
    if (!lookupEmail.trim()) {
      toast.error("Enter a patient email.");
      return;
    }

    setPatient({
      name: "Avery Stone",
      email: lookupEmail,
      records: patientHistory,
    });
    toast.success("Patient profile loaded.");
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar role="pharmacy" user={dashboardUser} />

      <motion.main
        className="flex-1 px-6 py-8 lg:px-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Pharmacy Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Verify Prescription</h1>
          </div>
          <ShieldCheck className="h-8 w-8 text-cyan-300" />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_auto]">
          <Input
            placeholder="Prescription ID"
            value={prescriptionId}
            onChange={(event) => setPrescriptionId(event.target.value)}
          />
          <Button onClick={handleVerify}>
            <ClipboardList className="h-4 w-4" /> Verify
          </Button>
        </section>

        {verified ? (
          <Card className="mt-6 border-white/10 bg-white/5">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Patient</p>
                  <p className="text-xl font-semibold">
                    {mockVerification.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Doctor</p>
                  <p className="text-xl font-semibold">
                    {mockVerification.doctorName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Date</p>
                  <p className="text-xl font-semibold">
                    {mockVerification.date.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Atorvastatin</TableCell>
                    <TableCell>20mg</TableCell>
                    <TableCell>Nightly</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Metformin</TableCell>
                    <TableCell>500mg</TableCell>
                    <TableCell>BID</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <AiSafetyBanner {...mockVerification.safety} />

              <SignatureBadge
                status="verified"
                txHash="0x8b7e5d9a44c21d8f3c91a0b8e1a64f2d5d7ce1f84f0c2e1fa1a24d8dfd114c19"
                timestamp={new Date(Date.now() - 1000 * 60 * 20)}
              />

              <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4" /> View History
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                Patient Lookup
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Patient email"
                  value={lookupEmail}
                  onChange={(event) => setLookupEmail(event.target.value)}
                />
                <Button onClick={handleLookup}>
                  <Search className="h-4 w-4" /> Lookup
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentPatient ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-sm text-slate-400">Patient Name</p>
                  <p className="text-xl font-semibold">{currentPatient.name}</p>
                  <p className="text-sm text-slate-400">
                    {currentPatient.email}
                  </p>
                </div>
                <div className="space-y-3">
                  {currentPatient.records.map((item) => (
                    <div
                      key={`${item.medication}-${item.dosage}`}
                      className={
                        item.current
                          ? "rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4"
                          : "rounded-2xl border border-white/10 bg-white/5 p-4"
                      }
                    >
                      <p className="font-medium">{item.medication}</p>
                      <p className="text-sm text-slate-400">
                        {item.dosage} • {item.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </section>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl border-white/10 bg-slate-900/95">
            <DialogHeader>
              <DialogTitle>Prescription History</DialogTitle>
              <DialogDescription>
                Mock audit history for the verified prescription.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {verifyHistory.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.date}</p>
                  </div>
                  <span className="text-sm text-cyan-300">{item.status}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHistoryOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.main>
    </div>
  );
}

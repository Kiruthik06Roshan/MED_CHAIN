"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CirclePlus, MinusCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/sidebar";
import AiSafetyBanner from "@/components/ai-safety-banner";
import type { SafetyCheckResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const dashboardUser = {
  name: "Dr. Maya Chen",
  email: "maya.doctor@vortexa.health",
};

const patients = [
  { value: "pat-1", label: "Avery Stone" },
  { value: "pat-2", label: "Jordan Patel" },
  { value: "pat-3", label: "Sam Rivera" },
] as const;

type MedicationRow = { name: string; dosage: string; frequency: string };

const initialRow: MedicationRow = { name: "", dosage: "", frequency: "" };

export default function PrescribePage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patients[0].value);
  const [medications, setMedications] = useState<MedicationRow[]>([initialRow]);
  const [diagnosis, setDiagnosis] = useState("");
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(
    null,
  );

  const canPrescribe = Boolean(
    diagnosis.trim() &&
    medications.every((row) => row.name && row.dosage && row.frequency) &&
    safetyResult,
  );

  const selectedPatient = useMemo(
    () =>
      patients.find((patient) => patient.value === patientId) ?? patients[0],
    [patientId],
  );

  function updateMedication(
    index: number,
    key: keyof MedicationRow,
    value: string,
  ) {
    setMedications((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }

  function addMedication() {
    setMedications((current) => [...current, initialRow]);
  }

  function removeMedication(index: number) {
    setMedications((current) =>
      current.filter((_, rowIndex) => rowIndex !== index),
    );
  }

  async function checkSafety() {
    setSafetyLoading(true);
    try {
      const response = await fetch("/api/ai/safety-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications, diagnosis, patientId }),
      });

      if (!response.ok) throw new Error("Safety check failed");

      const result = (await response.json()) as SafetyCheckResult;
      setSafetyResult(result);
      toast.success("Safety check completed.");
    } catch {
      setSafetyResult({
        status: "warning",
        message: "Manual review recommended before prescribing.",
        interactions: [
          {
            drug1: medications[0]?.name || "Medication 1",
            drug2: "Current regimen",
            severity: "warning",
            description:
              "Potential duplication or interaction should be reviewed.",
          },
        ],
        confidence: 0.68,
      });
      toast.error(
        "Unable to contact the safety check service. Showing a local fallback.",
      );
    } finally {
      setSafetyLoading(false);
    }
  }

  async function handlePrescribe() {
    if (!safetyResult) return;

    setSubmitLoading(true);
    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: "doctor-1",
          diagnosis,
          medications,
          ai_safety_check: safetyResult,
        }),
      });

      if (!response.ok) throw new Error("Prescription submission failed");

      toast.success("Prescription created.");
      router.push("/dashboard/doctor");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Prescription submission failed",
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar role="doctor" user={dashboardUser} />

      <motion.main
        className="flex-1 px-6 py-8 lg:px-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Button
              asChild
              variant="ghost"
              className="mb-4 px-0 text-slate-300 hover:bg-transparent hover:text-white"
            >
              <Link href="/dashboard/doctor">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Doctor Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Create Prescription</h1>
          </div>
          <ShieldCheck className="h-8 w-8 text-cyan-300" />
        </div>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>Choose Patient</SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.value} value={patient.value}>
                      {patient.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                Drafting for {selectedPatient.label}
              </div>
            </div>

            <div className="space-y-4">
              {medications.map((row, index) => (
                <div
                  key={`${index}-${row.name}`}
                  className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Medication name"
                    value={row.name}
                    onChange={(event) =>
                      updateMedication(index, "name", event.target.value)
                    }
                  />
                  <Input
                    placeholder="Dosage"
                    value={row.dosage}
                    onChange={(event) =>
                      updateMedication(index, "dosage", event.target.value)
                    }
                  />
                  <Input
                    placeholder="Frequency"
                    value={row.frequency}
                    onChange={(event) =>
                      updateMedication(index, "frequency", event.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => removeMedication(index)}
                    disabled={medications.length === 1}
                  >
                    <MinusCircle className="h-4 w-4" /> Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addMedication}>
                <CirclePlus className="h-4 w-4" /> Add Medication
              </Button>
            </div>

            <Textarea
              placeholder="Diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
            />

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={checkSafety}
                disabled={safetyLoading || !diagnosis.trim()}
              >
                {safetyLoading ? "Checking..." : "Check Safety"}
              </Button>
              <Button
                onClick={handlePrescribe}
                disabled={!canPrescribe || submitLoading}
              >
                {submitLoading ? "Submitting..." : "Prescribe"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {safetyResult ? (
          <div className="mt-6">
            <AiSafetyBanner {...safetyResult} />
          </div>
        ) : null}
      </motion.main>
    </div>
  );
}

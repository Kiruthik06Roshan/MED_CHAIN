"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Search, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/sidebar";
import HealthVaultCard from "@/components/health-vault-card";
import AiSafetyBanner from "@/components/ai-safety-banner";
import type { HealthRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const dashboardUser = {
  name: "Dr. Maya Chen",
  email: "maya.doctor@vortexa.health",
};

const patients = [
  {
    name: "Avery Stone",
    email: "avery.patient@vortexa.health",
    recordCount: 3,
    records: [
      {
        id: "doc-rec-1",
        patient_id: "pat-1",
        record_type: "prescription",
        title: "Atorvastatin 20mg",
        content:
          "Take one tablet nightly. Report muscle pain or unusual fatigue immediately.",
        metadata: {
          doctor_name: "Maya Chen",
          hospital: "Vortexa General",
          medications: ["Atorvastatin"],
        },
        created_at: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "doc-rec-2",
        patient_id: "pat-1",
        record_type: "allergy",
        title: "Latex Sensitivity",
        content:
          "Causes mild rash and itching. Use latex-free gloves and equipment.",
        metadata: { doctor_name: "Maya Chen", hospital: "Vortexa General" },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
    ] satisfies HealthRecord[],
  },
  {
    name: "Jordan Patel",
    email: "jordan.patient@vortexa.health",
    recordCount: 2,
    records: [
      {
        id: "doc-rec-3",
        patient_id: "pat-2",
        record_type: "lab_report",
        title: "HbA1c Result",
        content:
          "HbA1c level indicates diabetes management should be reviewed in 90 days.",
        metadata: {
          doctor_name: "Maya Chen",
          hospital: "North Star Diagnostics",
        },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        id: "doc-rec-4",
        patient_id: "pat-2",
        record_type: "note",
        title: "Follow-up Note",
        content: "Increase hydration and track fasting glucose daily.",
        metadata: {
          doctor_name: "Maya Chen",
          hospital: "North Star Diagnostics",
        },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 30),
      },
    ] satisfies HealthRecord[],
  },
  {
    name: "Sam Rivera",
    email: "sam.patient@vortexa.health",
    recordCount: 5,
    records: [
      {
        id: "doc-rec-5",
        patient_id: "pat-3",
        record_type: "prescription",
        title: "Amoxicillin 500mg",
        content: "Take three times daily for seven days.",
        metadata: {
          doctor_name: "Maya Chen",
          hospital: "City Care Center",
          medications: ["Amoxicillin"],
        },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 9),
      },
      {
        id: "doc-rec-6",
        patient_id: "pat-3",
        record_type: "allergy",
        title: "Pollen Allergy",
        content: "Seasonal allergic rhinitis managed with antihistamines.",
        metadata: { doctor_name: "Maya Chen", hospital: "City Care Center" },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ] satisfies HealthRecord[],
  },
] as const;

export default function DoctorDashboard() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedPatientEmail, setSelectedPatientEmail] = useState("");

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const value = searchValue.trim().toLowerCase();
      if (!value) return true;
      return (
        patient.email.toLowerCase().includes(value) ||
        patient.name.toLowerCase().includes(value)
      );
    });
  }, [searchValue]);

  const selectedPatient =
    patients.find((patient) => patient.email === selectedPatientEmail) ?? null;

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar role="doctor" user={dashboardUser} />

      <motion.main
        className="flex-1 px-6 py-8 lg:px-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Doctor Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Patient Search</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Patient email"
              className="sm:w-72"
            />
            <Button onClick={() => toast.info("Search filtered locally.")}>
              <Search className="h-4 w-4" /> Find Patient
            </Button>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.email} className="border-white/10 bg-white/5">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-sm text-slate-400">{patient.email}</p>
                  </div>
                  <UserRound className="h-5 w-5 text-cyan-300" />
                </div>
                <p className="text-sm text-slate-300">
                  {patient.recordCount} records in vault
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => toast.success("Request sent")}
                  >
                    Request Access
                  </Button>
                  <Button
                    onClick={() => setSelectedPatientEmail(patient.email)}
                  >
                    View Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {selectedPatient ? (
          <section className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                  Selected Patient
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {selectedPatient.name}
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/dashboard/doctor/prescribe">
                  <FileText className="h-4 w-4" /> Create Prescription
                </Link>
              </Button>
            </div>

            <div className="grid gap-6">
              {selectedPatient.records.map((record) => (
                <div key={record.id} className="space-y-4">
                  <HealthVaultCard record={record} />
                  {record.record_type === "prescription" ? (
                    <AiSafetyBanner
                      status="warning"
                      message="Prescribed medication should be reviewed against the patient's current regimen."
                      interactions={[
                        {
                          drug1: "Atorvastatin",
                          drug2: "Grapefruit Juice",
                          severity: "warning",
                          description:
                            "Grapefruit can increase statin concentration and side effects.",
                        },
                      ]}
                      confidence={0.74}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300/80">
            Quick Search Result
          </p>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Search a patient, review records, and move into prescription
            drafting.
          </div>
        </section>
      </motion.main>
    </div>
  );
}

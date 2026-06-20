"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, Plus, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/sidebar";
import HealthVaultCard from "@/components/health-vault-card";
import SignatureBadge from "@/components/signature-badge";
import type { HealthRecord, RecordItem } from "@/types";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const dashboardUser = {
  name: "Avery Stone",
  email: "avery.patient@vortexa.health",
  avatar: "",
};

const seedRecords: HealthRecord[] = [
  {
    id: "rec-1",
    patient_id: "pat-1",
    record_type: "prescription",
    title: "Metformin 500mg",
    content:
      "Take one tablet twice daily after meals. Monitor blood sugar levels and hydration throughout the day.",
    metadata: {
      doctor_name: "Leah Morgan",
      hospital: "Vortexa General",
      medications: ["Metformin"],
    },
    created_at: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: "rec-2",
    patient_id: "pat-1",
    record_type: "lab_report",
    title: "CBC Lab Report",
    content:
      "Lab values are within expected thresholds. Mild elevation in white blood cells noted for review.",
    metadata: { doctor_name: "Noah Patel", hospital: "North Star Diagnostics" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "rec-3",
    patient_id: "pat-1",
    record_type: "allergy",
    title: "Penicillin Allergy",
    content:
      "Patient reports severe rash and breathing difficulty after penicillin exposure. Avoid beta-lactam alternatives when possible.",
    metadata: { doctor_name: "Leah Morgan", hospital: "Vortexa General" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

const initialForm = {
  record_type: "prescription",
  title: "",
  content: "",
  metadata: "",
};

type GrantState = {
  recordId: string;
  doctorAddress: string;
  signerStatus: "verified" | "pending" | "failed";
  txHash?: string;
  timestamp?: Date;
};

export default function PatientDashboard() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(
    null,
  );
  const [form, setForm] = useState(initialForm);
  const [grantDoctorAddress, setGrantDoctorAddress] = useState("");
  const [grantState, setGrantState] = useState<GrantState | null>(null);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const response = await fetch("/api/records");
        if (!response.ok) throw new Error("Failed to load records");
        const data = await response.json();
        const mapped = Array.isArray(data)
          ? data.map((record) => ({
              ...record,
              created_at: record.created_at
                ? new Date(record.created_at)
                : new Date(),
            }))
          : [];
        setRecords(mapped.length ? mapped : seedRecords);
      } catch {
        toast.error("Could not load records. Showing local demo data.");
        setErrorMessage("Using demo records while the backend is unavailable.");
        setRecords(seedRecords);
      } finally {
        setLoading(false);
      }
    };

    void loadRecords();
  }, []);

  const stats = useMemo(() => {
    const activeGrants = 2;
    const pendingAlerts = records.filter(
      (record) => record.record_type === "allergy",
    ).length;

    return [
      {
        label: "Total Records",
        value: records.length.toString(),
        icon: FileText,
      },
      { label: "Active Grants", value: activeGrants.toString(), icon: Shield },
      {
        label: "Pending Alerts",
        value: pendingAlerts.toString(),
        icon: AlertTriangle,
      },
    ];
  }, [records]);

  async function handleUploadSubmit() {
    setSubmitLoading(true);
    try {
      const metadata = form.metadata.trim() ? JSON.parse(form.metadata) : {};
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: "pat-1",
          ...form,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const newRecord: HealthRecord = {
        id: `rec-${Date.now()}`,
        patient_id: "pat-1",
        record_type: form.record_type as HealthRecord["record_type"],
        title: form.title,
        content: form.content,
        metadata,
        created_at: new Date(),
      };

      setRecords((current) => [newRecord, ...current]);
      setForm(initialForm);
      setUploadOpen(false);
      toast.success("Record uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleGrantAccess(recordId: string) {
    const record = records.find((item) => item.id === recordId) ?? null;
    setSelectedRecord(record);
    setGrantOpen(true);
    setGrantDoctorAddress("");
    setGrantState(null);
  }

  async function signAndGrant() {
    if (!selectedRecord) return;
    if (!window.ethereum) {
      toast.error("No wallet detected.");
      return;
    }

    setGrantLoading(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const signer = accounts[0];
      const message = `Grant access to ${selectedRecord.id} for ${grantDoctorAddress} at ${Date.now()}`;
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, signer],
      })) as string;

      const response = await fetch("/api/access/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedRecord.id,
          granteeId: grantDoctorAddress,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error("Grant request failed");
      }

      setGrantState({
        recordId: selectedRecord.id,
        doctorAddress: grantDoctorAddress,
        signerStatus: "verified",
        txHash: signature.startsWith("0x") ? signature : undefined,
        timestamp: new Date(),
      });

      toast.success("Access granted.");
    } catch (error) {
      setGrantState({
        recordId: selectedRecord?.id ?? "",
        doctorAddress: grantDoctorAddress,
        signerStatus: "failed",
        timestamp: new Date(),
      });
      toast.error(
        error instanceof Error ? error.message : "Unable to grant access",
      );
    } finally {
      setGrantLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar role="patient" user={dashboardUser} />

      <motion.main
        className="flex-1 px-6 py-8 lg:px-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Patient Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Health Vault</h1>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" /> Upload Record
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-white/10 bg-white/5">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
                <Icon className="h-6 w-6 text-cyan-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm text-amber-400">{errorMessage}</p>
        ) : null}

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-white/10 bg-white/5 p-5">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-4 h-6 w-2/3" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
                <div className="mt-5 flex gap-3">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </Card>
            ))
          ) : records.length ? (
            records.map((record) => (
              <HealthVaultCard
                key={record.id}
                record={record}
                onGrantAccess={handleGrantAccess}
                onDelete={(recordId) =>
                  setRecords((current) =>
                    current.filter((item) => item.id !== recordId),
                  )
                }
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
              <p className="text-lg font-medium">No records yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Upload a record to start building your vault.
              </p>
              <Button className="mt-6" onClick={() => setUploadOpen(true)}>
                <Plus className="h-4 w-4" /> Upload Record
              </Button>
            </div>
          )}
        </section>
      </motion.main>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-slate-900/95">
          <DialogHeader>
            <DialogTitle>Upload Record</DialogTitle>
            <DialogDescription>
              Add a new health record to your vault.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Select
              value={form.record_type}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, record_type: value }))
              }
            >
              <SelectTrigger>Record Type</SelectTrigger>
              <SelectContent>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="lab_report">Lab Report</SelectItem>
                <SelectItem value="allergy">Allergy</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <Textarea
              placeholder="Content"
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
            />
            <Textarea
              placeholder='Metadata JSON, for example {"doctor_name":"Leah Morgan"}'
              value={form.metadata}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  metadata: event.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={submitLoading || !form.title || !form.content}
            >
              {submitLoading ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer open={grantOpen} onOpenChange={setGrantOpen}>
        <DrawerContent className="border-white/10 bg-slate-900">
          <DrawerHeader>
            <DrawerTitle>Grant Access</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-5 p-6 pt-0">
            {selectedRecord ? (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm text-slate-400">Record</p>
                  <p className="font-medium">{selectedRecord.title}</p>
                  <p className="text-sm text-slate-300">
                    {selectedRecord.content}
                  </p>
                </CardContent>
              </Card>
            ) : null}
            <Input
              placeholder="Doctor wallet address"
              value={grantDoctorAddress}
              onChange={(event) => setGrantDoctorAddress(event.target.value)}
            />
            <Button
              onClick={signAndGrant}
              disabled={grantLoading || !grantDoctorAddress || !selectedRecord}
            >
              {grantLoading ? "Signing..." : "Sign & Grant"}
            </Button>
            {grantState ? (
              <SignatureBadge
                status={grantState.signerStatus}
                txHash={grantState.txHash}
                timestamp={grantState.timestamp}
              />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

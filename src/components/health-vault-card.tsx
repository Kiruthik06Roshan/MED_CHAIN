"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Eye,
  FileText,
  FlaskConical,
  Share2,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { HealthRecord } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type HealthVaultCardProps = {
  record: HealthRecord;
  onGrantAccess?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
};

const recordConfig = {
  prescription: {
    icon: FileText,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    label: "Prescription",
  },
  lab_report: {
    icon: FlaskConical,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    label: "Lab Report",
  },
  allergy: {
    icon: AlertTriangle,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    label: "Allergy",
  },
  note: {
    icon: StickyNote,
    className: "border-slate-500/20 bg-slate-500/10 text-slate-300",
    label: "Note",
  },
} as const;

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function HealthVaultCard({
  record,
  onGrantAccess,
  onDelete,
}: HealthVaultCardProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const config = recordConfig[record.record_type];
  const Icon = config.icon;
  const preview = useMemo(() => record.content.slice(0, 180), [record.content]);
  const metadata = record.metadata ?? {};

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
    >
      <Card className="glass group rounded-2xl border-white/10 bg-white/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.18)] hover:border-cyan-400/30">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <Badge
              className={cn("inline-flex items-center gap-2", config.className)}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
            <div className="flex items-center gap-2">
              {onGrantAccess ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onGrantAccess(record.id)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {onDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </Button>
              ) : null}
            </div>
          </div>

          <CardTitle className="truncate text-white">{record.title}</CardTitle>
          <div className="space-y-1 text-sm">
            <p className="text-slate-400">
              {formatRelativeTime(record.created_at)}
            </p>
            {metadata.doctor_name ? (
              <p className="text-slate-300">Dr. {metadata.doctor_name}</p>
            ) : null}
            {metadata.hospital ? (
              <p className="text-slate-500">{metadata.hospital}</p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="line-clamp-2 text-sm text-slate-400">{preview}</p>
          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewOpen(true)}
            >
              <Eye className="h-4 w-4" /> View
            </Button>
            {onGrantAccess ? (
              <Button size="sm" onClick={() => onGrantAccess(record.id)}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-slate-900/95">
          <DialogHeader>
            <DialogTitle>{record.title}</DialogTitle>
            <DialogDescription>
              {config.label} • {formatRelativeTime(record.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {metadata.doctor_name ? (
              <p className="text-sm text-slate-300">
                Doctor: {metadata.doctor_name}
              </p>
            ) : null}
            {metadata.hospital ? (
              <p className="text-sm text-slate-300">
                Hospital: {metadata.hospital}
              </p>
            ) : null}
            {metadata.medications?.length ? (
              <p className="text-sm text-slate-300">
                Medications: {metadata.medications.join(", ")}
              </p>
            ) : null}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              {record.content}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the record from the current view. Confirm only if
              you want to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-400"
              onClick={() => {
                onDelete?.(record.id);
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

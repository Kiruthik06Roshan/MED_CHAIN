"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, ChevronDown, ShieldCheck } from "lucide-react";
import type { SafetyCheckResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AiSafetyBannerProps = SafetyCheckResult;

const statusConfig = {
  safe: {
    container: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: ShieldCheck,
    label: "Safe",
    pulse: "",
  },
  warning: {
    container: "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse-glow",
    icon: AlertTriangle,
    label: "Warning",
    pulse: "animate-pulse-glow",
  },
  danger: {
    container: "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse-glow animate-shake",
    icon: AlertOctagon,
    label: "Danger",
    pulse: "animate-pulse-glow animate-shake",
  },
} as const;

export default function AiSafetyBanner({ status, message, interactions, confidence }: AiSafetyBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[status];
  const Icon = config.icon;
  const confidenceValue = Math.max(0, Math.min(100, Math.round((confidence ?? 0) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("rounded-xl border p-4 shadow-lg", config.container)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="border-white/10 bg-white/10 text-inherit">
              <Icon className="mr-1 h-3.5 w-3.5" />
              {config.label}
            </Badge>
          </div>
          <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="font-medium">
            {message}
          </motion.p>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setExpanded((current) => !current)} className="shrink-0 text-inherit hover:bg-white/5">
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
          View Details
        </Button>
      </div>

      {typeof confidence === "number" ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-current/80">Confidence</span>
            <span className="font-medium">{confidenceValue}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-current transition-all" style={{ width: `${confidenceValue}%` }} />
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {interactions.length ? (
                interactions.map((interaction, index) => (
                  <motion.div
                    key={`${interaction.drug1}-${interaction.drug2}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border border-white/10 bg-black/10 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-white">{interaction.drug1}</span>
                      <span className="text-slate-400">+</span>
                      <span className="font-medium text-white">{interaction.drug2}</span>
                      <Badge
                        className={cn(
                          interaction.severity === "safe" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                          interaction.severity === "warning" && "border-amber-500/20 bg-amber-500/10 text-amber-400",
                          interaction.severity === "danger" && "border-rose-500/20 bg-rose-500/10 text-rose-400",
                        )}
                      >
                        {interaction.severity}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{interaction.description}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-current/80">No interactions detected.</p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
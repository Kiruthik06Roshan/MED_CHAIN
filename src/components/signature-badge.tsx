"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clipboard,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignatureBadgeProps = {
  status: "verified" | "pending" | "failed";
  txHash?: string;
  timestamp?: Date;
};

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

export default function SignatureBadge({
  status,
  txHash,
  timestamp,
}: SignatureBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const config = useMemo(() => {
    if (status === "verified") {
      return {
        container:
          "border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.2)]",
        icon: CheckCircle,
        label: "On-Chain Verified",
      };
    }

    if (status === "pending") {
      return {
        container: "border-slate-500/20 bg-slate-500/10 text-slate-300",
        icon: Clock,
        label: "Verifying...",
      };
    }

    return {
      container: "border-rose-500/20 bg-rose-500/10 text-rose-400",
      icon: XCircle,
      label: "Verification Failed",
    };
  }, [status]);

  const Icon = config.icon;
  const truncatedHash = txHash
    ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
    : null;

  async function copyHash() {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    toast.success("Copied!");
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "inline-flex flex-col gap-2 rounded-2xl border px-3 py-2",
        config.container,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="inline-flex items-center gap-2 text-left"
      >
        <Icon
          className={cn("h-4 w-4", status === "pending" && "animate-spin")}
        />
        <span className="text-sm font-medium">{config.label}</span>
        {status === "verified" ? (
          <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            Sepolia
          </Badge>
        ) : null}
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-2 text-xs text-current/90">
          {truncatedHash ? <p className="font-mono">{truncatedHash}</p> : null}
          {timestamp ? (
            <p className="mt-1 text-current/70">
              {formatRelativeTime(timestamp)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {txHash ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHash}
                  className="h-8 px-3 text-current"
                >
                  <Clipboard className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-current"
                >
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Explorer
                  </a>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useState } from "react";
import type { AuditLog } from "@/types";

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLogs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/audit/log", { method: "GET" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to fetch audit logs");
      }

      const data = (await response.json()) as AuditLog[];
      setLogs(data ?? []);
    } catch (caught) {
      setLogs([]);
      setError(caught instanceof Error ? caught.message : "Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchLogs();
  }, []);

  return { logs, isLoading, error, refresh: fetchLogs };
}

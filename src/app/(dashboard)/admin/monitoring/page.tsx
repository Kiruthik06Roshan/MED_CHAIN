'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NetworkStatus } from '@/components/blockchain/NetworkStatus';
import { WalletStatus } from '@/components/blockchain/WalletStatus';
import { Activity, Database, Zap } from 'lucide-react';

interface MonitoringData {
  apiLatency: number;
  dbConnections: number;
  contractAvailable: boolean;
  errorRate: number;
  uptime: number;
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/monitoring').then(r => r.ok ? r.json() : null).then(setData).finally(() => setLoading(false));
  }, []);

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <div className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );

  return (
    <div>
      <PageHeader title="System Monitoring" description="Real-time system health and performance metrics." />
      {loading ? <LoadingSpinner className="py-12" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">API Performance</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Latency</span>
                <span className="font-medium">{data?.apiLatency ?? '—'} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error Rate</span>
                <span className="font-medium">{data?.errorRate ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">{data?.uptime ?? 100}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Database</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  <StatusDot ok={(data?.dbConnections ?? 0) > 0} />
                  <span className="font-medium">{(data?.dbConnections ?? 0) > 0 ? 'Healthy' : 'Degraded'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-medium">{data?.dbConnections ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Contract</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusDot ok={data?.contractAvailable ?? false} />
              <span className="text-sm font-medium">{data?.contractAvailable ? 'Available' : 'Unavailable'}</span>
            </div>
          </div>

          <NetworkStatus className="md:col-span-1" />
          <WalletStatus className="md:col-span-1" />
        </div>
      )}
    </div>
  );
}

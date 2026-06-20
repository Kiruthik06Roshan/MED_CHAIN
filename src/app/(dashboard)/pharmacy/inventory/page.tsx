'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Package, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  medication: string;
  quantityOnHand: number;
  reorderThreshold: number;
  lastUpdated: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pharmacy/inventory').then(r => r.ok ? r.json() : []).then(setInventory).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Inventory" description="Monitor medication stock levels and reorder thresholds." />

      {loading ? <LoadingSpinner className="py-12" /> :
        inventory.length === 0 ? (
          <EmptyState icon={Package} title="No inventory data" description="Inventory records will appear here once added." />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Medication</th>
                  <th className="text-left px-4 py-3 font-medium">On Hand</th>
                  <th className="text-left px-4 py-3 font-medium">Reorder At</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{item.medication}</td>
                    <td className="px-4 py-3">{item.quantityOnHand}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.reorderThreshold}</td>
                    <td className="px-4 py-3">
                      {item.quantityOnHand <= item.reorderThreshold ? (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

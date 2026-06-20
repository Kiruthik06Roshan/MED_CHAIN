'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getVaultRecords } from '@/services/patient';
import type { MedicalRecord } from '@/types/patient';
import { Vault, FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const typeLabels: Record<string, string> = {
  prescription: 'Prescription',
  lab: 'Lab Result',
  note: 'Clinical Note',
  encounter: 'Encounter',
  attachment: 'Attachment',
};

export default function VaultPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getVaultRecords().then(setRecords).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? records.filter(r => r.type === filter) : records;

  return (
    <div>
      <PageHeader title="Health Vault" description="All your medical records in one secure place." />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'prescription', 'lab', 'note', 'encounter'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === t ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-muted-foreground hover:bg-secondary'}`}>
            {t ? typeLabels[t] : 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-12" /> :
        filtered.length === 0 ? (
          <EmptyState icon={Vault} title="No records found"
            description="Your health vault is empty. Records added by your healthcare providers will appear here." />
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Record</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Provider</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Verified</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{rec.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-secondary px-2 py-0.5 rounded text-xs">{typeLabels[rec.type] ?? rec.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rec.provider}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(rec.date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      {rec.signatureProof
                        ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                        : <XCircle className="w-4 h-4 text-muted-foreground" />}
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 text-primary hover:underline text-xs">
                        <Download className="w-3 h-3" /> Download
                      </button>
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

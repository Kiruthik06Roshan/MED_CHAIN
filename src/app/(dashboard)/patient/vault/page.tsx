'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { getVaultRecords } from '@/services/patient';
import type { MedicalRecord } from '@/types/patient';
import {
  Vault, FileText, Download, CheckCircle, XCircle,
  Upload, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';

const typeLabels: Record<string, string> = {
  prescription: 'Prescription',
  lab:          'Lab Result',
  note:         'Clinical Note',
  encounter:    'Encounter',
  attachment:   'Attachment',
};

const FILE_TYPE_ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg':      '🖼️',
  'image/png':       '🖼️',
  'text/plain':      '📝',
};

function fileIcon(mime?: string) {
  return mime ? (FILE_TYPE_ICON[mime] ?? '📎') : '📎';
}

export default function VaultPage() {
  const [records, setRecords]           = useState<MedicalRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('');
  const [showUploader, setShowUploader] = useState(false);

  const load = () => {
    setLoading(true);
    getVaultRecords().then(setRecords).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter ? records.filter(r => r.type === filter) : records;

  return (
    <div>
      <PageHeader
        title="Health Vault"
        description="All your medical records in one secure place."
        actions={
          <button
            onClick={() => setShowUploader(v => !v)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
            {showUploader
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        }
      />

      {/* ── Upload Panel (collapsible) ─────────────────────────────────────── */}
      {showUploader && (
        <div className="mb-6 bg-white border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Upload Medical Documents
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Upload PDFs, images, or reports. Only you can see them until you grant consent to a provider.
          </p>
          <DocumentUploader
            onUploadComplete={() => {
              load();
              // Collapse uploader after first successful upload
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'prescription', 'lab', 'note', 'encounter', 'attachment'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-white border border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t ? typeLabels[t] : 'All'}
          </button>
        ))}
      </div>

      {/* ── Records table ──────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Vault}
          title="No records found"
          description="Your health vault is empty. Records added by your healthcare providers will appear here, or upload your own documents above."
          action={
            !showUploader ? (
              <button
                onClick={() => setShowUploader(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload your first document
              </button>
            ) : undefined
          }
        />
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
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {rec.isFile ? (
                        <span className="text-lg leading-none">{fileIcon(rec.fileType)}</span>
                      ) : (
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium block truncate max-w-[200px]">{rec.title}</span>
                        {rec.isFile && rec.fileName && (
                          <span className="text-xs text-muted-foreground block truncate max-w-[200px]">
                            {rec.fileName}
                            {rec.fileSize ? ` · ${(rec.fileSize / 1024).toFixed(1)} KB` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <span className="bg-secondary px-2 py-0.5 rounded text-xs">
                      {typeLabels[rec.type] ?? rec.type}
                    </span>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-3 text-muted-foreground">{rec.provider}</td>

                  {/* Date */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(rec.date), 'MMM d, yyyy')}
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-3">
                    {rec.signatureProof
                      ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                      : <XCircle    className="w-4 h-4 text-muted-foreground" />}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {rec.isFile ? (
                      <DocumentViewer
                        documentId={rec.id}
                        fileName={rec.fileName}
                      />
                    ) : (
                      <button className="flex items-center gap-1 text-primary hover:underline text-xs">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
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

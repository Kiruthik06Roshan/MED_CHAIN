'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { createClient } from '@/lib/supabaseClient';
import {
  Shield, ShieldOff, FileText, Upload,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PatientRecord {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  type: string;
}

interface ConsentInfo {
  id: string;
  purpose: string;
  expires_at: string;
}

const FILE_TYPE_ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg':      '🖼️',
  'image/png':       '🖼️',
  'text/plain':      '📝',
};

function fileIcon(mime?: string) {
  return mime ? (FILE_TYPE_ICON[mime] ?? '📎') : '📎';
}

export default function HospitalPatientRecordsPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [records, setRecords]         = useState<PatientRecord[]>([]);
  const [consent, setConsent]         = useState<ConsentInfo | null>(null);
  const [patientName, setPatientName] = useState('Patient');
  const [loading, setLoading]         = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadAll = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // ── Fetch patient name ─────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', patientId)
      .single();

    if (profile?.full_name) setPatientName(profile.full_name);

    // ── Check consent ──────────────────────────────────────────────────────
    const { data: c } = await supabase
      .from('consents')
      .select('id, purpose, expires_at')
      .eq('patient_id', patientId)
      .eq('grantee_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    setConsent(c ?? null);

    if (c) {
      // ── Load file records shared via this consent ───────────────────────
      const { data: shares } = await supabase
        .from('document_shares')
        .select('document_id')
        .eq('consent_id', c.id);

      const docIds = (shares ?? []).map(s => s.document_id);

      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from('medical_records')
          .select('id, data, file_name, file_type, file_size, created_at, type')
          .in('id', docIds)
          .eq('is_file', true)
          .order('created_at', { ascending: false });

        setRecords(
          (docs ?? []).map(d => ({
            ...d,
            title: (d.data as Record<string, string>)?.title ?? d.file_name ?? 'Document',
          })),
        );
      } else {
        setRecords([]);
      }
    }

    setLoading(false);
  };

  // ── No consent state ────────────────────────────────────────────────────────
  if (!loading && !consent) {
    return (
      <div>
        <PageHeader title={`${patientName}'s Records`} description="Access is controlled by patient consent." />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-5">
            <ShieldOff className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Active Consent</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            You need an active consent from this patient to view their records. 
            Request access via the Consent Requests page.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-4 py-2 bg-secondary/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Patient must approve your request from their dashboard.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${patientName}'s Records`}
        description="Documents shared with you via active consent."
        actions={
          consent ? (
            <div className="flex items-center gap-3">
              {/* Consent badge */}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <Shield className="w-3.5 h-3.5" />
                Consent active until {format(new Date(consent.expires_at), 'MMM d, yyyy')}
              </span>
              {/* Upload for this patient */}
              <button
                onClick={() => setShowUploader(v => !v)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
                {showUploader
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <>
          {/* ── Upload Panel ─────────────────────────────────────────────── */}
          {showUploader && consent && (
            <div className="mb-6 bg-white border border-border rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Document for {patientName}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Documents you upload will be attached to this patient's vault.
              </p>
              <DocumentUploader
                patientId={patientId}
                onUploadComplete={() => {
                  loadAll();
                  setShowUploader(false);
                }}
              />
            </div>
          )}

          {/* ── Records list ─────────────────────────────────────────────── */}
          {records.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No shared documents"
              description="No documents have been explicitly shared with you via this consent yet."
              action={
                consent && (
                  <button
                    onClick={() => setShowUploader(true)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload a document for this patient
                  </button>
                )
              }
            />
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Document</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Size</th>
                    <th className="text-left px-4 py-3 font-medium">Uploaded</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map(rec => (
                    <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{fileIcon(rec.file_type)}</span>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[220px]">{rec.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {rec.file_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-secondary px-2 py-0.5 rounded text-xs">
                          {rec.file_type?.split('/')[1]?.toUpperCase() ?? rec.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {rec.file_size ? `${(rec.file_size / 1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(rec.created_at))} ago
                      </td>
                      <td className="px-4 py-3">
                        <DocumentViewer documentId={rec.id} fileName={rec.file_name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

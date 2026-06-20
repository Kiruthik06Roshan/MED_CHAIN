'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const ACCEPTED_TYPES = {
  'application/pdf':   ['.pdf'],
  'image/jpeg':        ['.jpg', '.jpeg'],
  'image/png':         ['.png'],
  'text/plain':        ['.txt'],
  'application/dicom': ['.dcm'],
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadedRecord {
  id: string;
  title: string;
  fileName: string;
}

interface Props {
  /** If a hospital is uploading on behalf of a patient, pass the patientId */
  patientId?: string;
  onUploadComplete?: (record: UploadedRecord) => void;
  className?: string;
}

interface PendingFile {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

export function DocumentUploader({ patientId, onUploadComplete, className }: Props) {
  const [pending, setPending]   = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    rejected.forEach(r => {
      const msg = r.errors.map(e => e.message).join(', ');
      console.warn(`Rejected ${r.file.name}: ${msg}`);
    });
    setPending(prev => [
      ...prev,
      ...accepted.map(f => ({ file: f, status: 'pending' as const })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const remove = (idx: number) => {
    if (uploading) return;
    setPending(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadAll = async () => {
    const toUpload = pending.filter(p => p.status === 'pending');
    if (toUpload.length === 0) return;

    setUploading(true);
    setProgress(0);

    let completed = 0;

    for (const item of toUpload) {
      // Mark as uploading
      setPending(prev =>
        prev.map(p => p.file === item.file ? { ...p, status: 'uploading' } : p),
      );

      try {
        const fd = new FormData();
        fd.append('file', item.file);
        fd.append('title', item.file.name.replace(/\.[^.]+$/, '')); // strip extension
        fd.append('recordType', 'attachment');
        if (patientId) fd.append('patientId', patientId);

        const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(body.error ?? 'Upload failed');
        }

        const { record } = await res.json();
        onUploadComplete?.(record);

        setPending(prev =>
          prev.map(p => p.file === item.file ? { ...p, status: 'done' } : p),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setPending(prev =>
          prev.map(p => p.file === item.file ? { ...p, status: 'error', errorMsg: msg } : p),
        );
      }

      completed++;
      setProgress(Math.round((completed / toUpload.length) * 100));
    }

    setUploading(false);
    // Clear done files after a short delay
    setTimeout(() => {
      setPending(prev => prev.filter(p => p.status !== 'done'));
    }, 1500);
  };

  const pendingCount  = pending.filter(p => p.status === 'pending').length;
  const hasAnyPending = pendingCount > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 select-none',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-secondary/30',
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            'mx-auto h-10 w-10 mb-3 transition-colors',
            isDragActive ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        {isDragActive ? (
          <p className="text-primary font-medium">Drop files here…</p>
        ) : (
          <>
            <p className="text-foreground font-medium">
              Drag &amp; drop files, or{' '}
              <span className="text-primary underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, PNG, JPG, TXT, DICOM — up to 10 MB each
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors',
                item.status === 'done'    && 'border-emerald-200 bg-emerald-50',
                item.status === 'error'   && 'border-red-200 bg-red-50',
                item.status === 'uploading' && 'border-primary/40 bg-primary/5',
                item.status === 'pending' && 'border-border bg-white',
              )}
            >
              {/* Icon */}
              {item.status === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : item.status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : item.status === 'uploading' ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <File className="h-5 w-5 text-muted-foreground shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.status === 'error'
                    ? item.errorMsg
                    : `${(item.file.size / 1024).toFixed(1)} KB`}
                </p>
              </div>

              {/* Remove button (only for pending/error) */}
              {(item.status === 'pending' || item.status === 'error') && !uploading && (
                <button
                  onClick={() => remove(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-auto shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {/* Progress bar (while uploading) */}
          {uploading && (
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Upload button */}
          {hasAnyPending && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg',
                'text-sm font-medium transition-colors',
                uploading
                  ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading… {progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

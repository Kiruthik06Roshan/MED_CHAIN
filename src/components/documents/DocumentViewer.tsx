'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, AlertCircle, X, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  documentId: string;
  /** Custom trigger element. Defaults to a "View" button. */
  trigger?: React.ReactNode;
  fileName?: string;
}

interface DocData {
  signedUrl: string;
  fileType: string;
  fileName: string;
}

export function DocumentViewer({ documentId, trigger, fileName }: Props) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc]         = useState<DocData | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const openDocument = async () => {
    // If already loaded, just re-open the modal
    if (doc) { setOpen(true); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}`, { credentials: 'include' });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to load document' }));
        setError(body.error ?? 'Failed to load document');
        return;
      }

      const data = await res.json();
      setDoc({ signedUrl: data.signedUrl, fileType: data.fileType, fileName: data.fileName });
      setOpen(true);
    } catch {
      setError('Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const close = () => setOpen(false);

  const isImage = doc?.fileType?.startsWith('image/');
  const isPDF   = doc?.fileType === 'application/pdf';

  return (
    <>
      {/* Trigger */}
      <div onClick={openDocument} className="inline-flex cursor-pointer">
        {trigger ?? (
          <button
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg',
              'text-primary border border-primary/30 hover:bg-primary/10 transition-colors',
              loading && 'opacity-60 cursor-not-allowed',
            )}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {loading ? 'Loading…' : 'View'}
          </button>
        )}
      </div>

      {/* Error toast (inline, no modal) */}
      {error && !open && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {doc?.fileName ?? fileName ?? 'Document'}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {doc?.signedUrl && (
                  <a
                    href={doc.signedUrl}
                    download={doc.fileName}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
                <button
                  onClick={close}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-secondary/30 min-h-[320px] flex items-center justify-center p-4">
              {!doc ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">{error ?? 'No document loaded'}</p>
                </div>
              ) : isImage ? (
                /* Image preview */
                <img
                  src={doc.signedUrl}
                  alt={doc.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
                />
              ) : isPDF ? (
                /* PDF inline */
                <iframe
                  src={doc.signedUrl}
                  title={doc.fileName}
                  className="w-full h-[70vh] rounded-lg"
                />
              ) : (
                /* Fallback: download prompt */
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Preview not available for this file type.
                  </p>
                  <a
                    href={doc.signedUrl}
                    download={doc.fileName}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Download to view
                  </a>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="px-5 py-2 border-t border-border bg-secondary/20 shrink-0">
              <p className="text-xs text-muted-foreground text-center">
                Secure access link expires in 60 seconds. Reload to refresh.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

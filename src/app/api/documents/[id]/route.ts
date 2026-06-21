import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createServerSupabaseClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // ── Fetch document metadata ───────────────────────────────────────────────
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select('id, patient_id, file_name, file_type, storage_path, is_file')
      .eq('id', documentId)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!record.is_file || !record.storage_path) {
      return NextResponse.json({ error: 'No file attached to this record' }, { status: 400 });
    }

    // ── Access check ──────────────────────────────────────────────────────────
    const isOwner = record.patient_id === user.id;
    const isAdmin = profile?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      // Check for an active consent that covers this patient's records
      const { data: consent } = await supabase
        .from('consents')
        .select('id')
        .eq('patient_id', record.patient_id)
        .eq('grantee_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!consent) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // ── Verify document is explicitly shared via this consent ─────────────
      const { data: share } = await supabase
        .from('document_shares')
        .select('id')
        .eq('document_id', documentId)
        .eq('consent_id', consent.id)
        .maybeSingle();

      if (!share) {
        return NextResponse.json(
          { error: 'This document has not been shared via your consent' },
          { status: 403 },
        );
      }
    }

    // ── Generate 60-second signed URL ─────────────────────────────────────────
    const { data: signed, error: signedError } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(record.storage_path, 60);

    if (signedError || !signed) {
      console.error('[documents/view] signed URL error:', signedError);
      return NextResponse.json({ error: 'Failed to generate access URL' }, { status: 500 });
    }

    // ── Audit ─────────────────────────────────────────────────────────────────
    await logAccess({
      actorId:   user.id,
      actorRole: profile!.role as Parameters<typeof logAccess>[0]['actorRole'],
      action:    'VIEW_DOCUMENT',
      targetId:  documentId,
      scope:     [] as Parameters<typeof logAccess>[0]['scope'],
      result:    'success',
    });


    return NextResponse.json({
      success:   true,
      signedUrl: signed.signedUrl,
      expiresIn: 60,
      fileName:  record.file_name,
      fileType:  record.file_type,
    });
  } catch (err) {
    console.error('[documents/view]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

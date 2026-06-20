import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { logAccess } from '@/services/audit';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/dicom',
];

const MIME_FROM_EXT: Record<string, string> = {
  pdf:  'application/pdf',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  dcm:  'application/dicom',
  txt:  'text/plain',
};

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_FROM_EXT[ext] ?? 'application/octet-stream';
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['PATIENT', 'HOSPITAL', 'ADMIN'];
    if (!allowedRoles.includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    const formData = await req.formData();
    const file      = formData.get('file') as File | null;
    const patientId = (formData.get('patientId') as string | null) ?? user.id;
    const recordType = (formData.get('recordType') as string | null) ?? 'attachment';
    const title     = (formData.get('title') as string | null) ?? file?.name ?? 'Document';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Hospital must have consent before uploading for another patient ────────
    let activeConsentId: string | null = null;
    if (profile?.role === 'HOSPITAL' && patientId !== user.id) {
      const { data: consent } = await supabase
        .from('consents')
        .select('id')
        .eq('patient_id', patientId)
        .eq('grantee_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!consent) {
        return NextResponse.json(
          { error: 'No active consent from this patient' },
          { status: 403 },
        );
      }
      activeConsentId = consent.id;
    }

    // ── Validate file ─────────────────────────────────────────────────────────
    const contentType = resolveContentType(file);
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
    }

    // ── Storage path: patientId/timestamp-safeName ────────────────────────────
    const safeName    = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${patientId}/${Date.now()}-${safeName}`;

    // ── Upload to Supabase Storage ────────────────────────────────────────────
    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      console.error('[documents/upload] storage error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // ── Create medical_records row ────────────────────────────────────────────
    const { data: record, error: dbError } = await supabase
      .from('medical_records')
      .insert({
        patient_id:   patientId,
        type:         recordType,
        data: {
          title,
          provider:     profile?.role === 'HOSPITAL' ? 'Provider Upload' : 'Self Upload',
          originalName: file.name,
          mimeType:     contentType,
          size:         file.size,
        },
        file_name:    file.name,
        file_type:    contentType,
        file_size:    file.size,
        storage_path: storagePath,
        is_file:      true,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback the storage object
      await supabase.storage.from('medical-documents').remove([storagePath]);
      console.error('[documents/upload] db error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (activeConsentId) {
      const { error: shareError } = await supabase
        .from('document_shares')
        .insert({
          document_id: record.id,
          consent_id:  activeConsentId,
        });

      if (shareError) {
        console.error('[documents/upload] share error:', shareError);
      }
    }

    // ── Audit ─────────────────────────────────────────────────────────────────
    await logAccess({
      actorId:   user.id,
      actorRole: profile!.role as Parameters<typeof logAccess>[0]['actorRole'],
      action:    'UPLOAD_DOCUMENT',
      targetId:  record.id,
      scope:     [] as Parameters<typeof logAccess>[0]['scope'],
      result:    'success',
    });

    return NextResponse.json({
      success: true,
      record: {
        id:          record.id,
        title,
        fileName:    file.name,
        fileType:    contentType,
        fileSize:    file.size,
        storagePath: storagePath,
        isFile:      true,
        createdAt:   record.created_at,
      },
    });
  } catch (err) {
    console.error('[documents/upload]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

// POST /api/seed         — full wipe + recreate of demo users and data
// DELETE /api/seed/cleanup — just wipe auth users (after you've cleared public data via SQL)
// Only works in development.

const DEMOS = [
  { email: 'patient@demo.medchain',   password: 'Demo@1234', full_name: 'John Smith',         role: 'PATIENT',   org: null },
  { email: 'hospital@demo.medchain',  password: 'Demo@1234', full_name: 'Dr. Emily Chen',     role: 'HOSPITAL',  org: 'City General Hospital' },
  { email: 'pharmacy@demo.medchain',  password: 'Demo@1234', full_name: 'Metro Pharmacy',     role: 'PHARMACY',  org: 'Metro Pharmacy' },
  { email: 'insurance@demo.medchain', password: 'Demo@1234', full_name: 'HealthShield Agent', role: 'INSURANCE', org: 'HealthShield Insurance' },
  { email: 'admin@demo.medchain',     password: 'Demo@1234', full_name: 'System Admin',       role: 'ADMIN',     org: null },
] as const;

const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const fwd = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }
  return null;
}

// ── DELETE /api/seed — delete existing demo auth users via admin SDK ──────────
// Call this AFTER running the public-data cleanup SQL in the Supabase editor.
export async function DELETE() {
  const guard = devOnly(); if (guard) return guard;

  const admin = createAdminClient();
  const log: string[] = [];

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const demoUsers = users.filter(u => u.email?.endsWith('@demo.medchain'));

  for (const u of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) {
      log.push(`WARN: could not delete ${u.email}: ${error.message}`);
    } else {
      log.push(`deleted auth user: ${u.email} (${u.id})`);
    }
  }

  return NextResponse.json({ deleted: demoUsers.length, log });
}

// ── POST /api/seed — full wipe + fresh create ─────────────────────────────────
export async function POST() {
  const guard = devOnly(); if (guard) return guard;

  try {
    const admin = createAdminClient();
    const log: string[] = [];

    // ── Step 1: find existing demo users, delete public data, delete auth users ─
    const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = allUsers.filter(u => u.email?.endsWith('@demo.medchain'));
    const existingIds = existing.map(u => u.id);

    if (existingIds.length > 0) {
      // Delete public tables (FK children first)
      await admin.from('audit_logs').delete().in('actor_id', existingIds);
      await admin.from('audit_logs').delete().in('target_id', existingIds);
      await admin.from('fraud_alerts').delete().in('patient_id', existingIds);
      await admin.from('ai_insights').delete().in('patient_id', existingIds);
      await admin.from('verification_requests').delete().in('patient_id', existingIds);
      await admin.from('verification_requests').delete().in('insurance_id', existingIds);
      await admin.from('insurance_claims').delete().in('patient_id', existingIds);
      await admin.from('insurance_claims').delete().in('insurance_id', existingIds);
      await admin.from('pharmacy_dispensings').delete().in('pharmacy_id', existingIds);
      await admin.from('consent_requests').delete().in('patient_id', existingIds);
      await admin.from('consent_requests').delete().in('requestor_id', existingIds);
      await admin.from('consents').delete().in('patient_id', existingIds);
      await admin.from('consents').delete().in('grantee_id', existingIds);
      await admin.from('medical_records').delete().in('patient_id', existingIds);
      await admin.from('prescriptions').delete().in('patient_id', existingIds);
      await admin.from('user_profiles').delete().in('id', existingIds);
      log.push(`cleared public data for ${existingIds.length} existing demo user(s)`);

      // Now delete auth users — admin SDK handles auth.identities cascade
      for (const u of existing) {
        await admin.auth.admin.deleteUser(u.id);
        log.push(`deleted auth user: ${u.email}`);
      }
    }

    // ── Step 2: Create fresh auth users ───────────────────────────────────────
    const ids: Record<string, string> = {};
    for (const demo of DEMOS) {
      const { data, error } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        user_metadata: { full_name: demo.full_name, role: demo.role, organization_name: demo.org },
        email_confirm: true,
      });
      if (error) throw new Error(`createUser ${demo.email}: ${error.message}`);
      ids[demo.role] = data.user.id;
      log.push(`created auth user: ${demo.email} → ${data.user.id}`);
    }

    const P  = ids.PATIENT;
    const H  = ids.HOSPITAL;
    const PH = ids.PHARMACY;
    const I  = ids.INSURANCE;

    // ── Step 3: User profiles ─────────────────────────────────────────────────
    await admin.from('user_profiles').insert(
      DEMOS.map(d => ({
        id: ids[d.role],
        email: d.email,
        full_name: d.full_name,
        role: d.role,
        organization_name: d.org,
        is_disabled: false,
      })),
    );
    log.push('user_profiles inserted');

    // ── Step 4: Prescriptions ─────────────────────────────────────────────────
    const rx1 = crypto.randomUUID();
    const rx2 = crypto.randomUUID();
    const rx3 = crypto.randomUUID();

    await admin.from('prescriptions').insert([
      {
        id: rx1, patient_id: P, prescriber_id: H,
        medication: 'Metformin', dosage: '500mg twice daily',
        quantity: 60, refills: 3,
        date_issued: ago(10), expiry_date: fwd(180),
        notes: 'Take with meals. Monitor blood glucose weekly.',
        status: 'active',
      },
      {
        id: rx2, patient_id: P, prescriber_id: H,
        medication: 'Lisinopril', dosage: '10mg once daily',
        quantity: 30, refills: 5,
        date_issued: ago(30), expiry_date: fwd(330),
        notes: 'Take in the morning. Avoid potassium supplements.',
        status: 'active',
      },
      {
        id: rx3, patient_id: P, prescriber_id: H,
        medication: 'Amoxicillin', dosage: '250mg three times daily',
        quantity: 21, refills: 0,
        date_issued: ago(60), expiry_date: ago(15),
        notes: 'Complete full course.',
        status: 'filled',
      },
    ]);
    log.push('prescriptions inserted');

    // ── Step 5: Medical records ───────────────────────────────────────────────
    await admin.from('medical_records').insert([
      {
        patient_id: P, type: 'lab', created_at: ago(5),
        data: { title: 'HbA1c Panel', provider: 'City General Lab', result: '7.2%', reference: '<7.0%', interpretation: 'Slightly elevated', ordered_by: 'Dr. Emily Chen' },
      },
      {
        patient_id: P, type: 'lab', created_at: ago(5),
        data: { title: 'Comprehensive Metabolic Panel', provider: 'City General Lab', result: 'Normal', cholesterol: '185 mg/dL', ordered_by: 'Dr. Emily Chen' },
      },
      {
        patient_id: P, type: 'encounter', created_at: ago(10),
        data: { title: 'Annual Physical Examination', provider: 'City General Hospital', physician: 'Dr. Emily Chen', assessment: 'Type 2 Diabetes — well controlled. Hypertension — stable.', plan: 'Continue medications. Repeat HbA1c in 3 months.' },
      },
      {
        patient_id: P, type: 'note', created_at: ago(10),
        data: { title: 'Patient Care Note', author: 'Dr. Emily Chen', content: 'Good medication adherence. BP 128/82 mmHg. Weight stable.' },
      },
      {
        patient_id: P, type: 'attachment', created_at: ago(20),
        data: { title: 'Chest X-Ray', modality: 'X-Ray', findings: 'No acute cardiopulmonary process. Lungs clear.', radiologist: 'Dr. Mark Lee' },
      },
    ]);
    log.push('medical_records inserted');

    // ── Step 6: Consents ──────────────────────────────────────────────────────
    const c1 = crypto.randomUUID();
    const c2 = crypto.randomUUID();
    await admin.from('consents').insert([
      {
        id: c1, patient_id: P, grantee_id: H,
        purpose: 'Ongoing care and treatment by City General Hospital',
        scope: ['medical_records', 'prescriptions', 'lab_results'],
        is_active: true, expires_at: fwd(365), granted_at: ago(10),
      },
      {
        id: c2, patient_id: P, grantee_id: PH,
        purpose: 'Prescription dispensing and medication history review',
        scope: ['prescriptions'],
        is_active: true, expires_at: fwd(180), granted_at: ago(5),
      },
    ]);
    log.push('consents inserted');

    // ── Step 7: Consent requests ──────────────────────────────────────────────
    await admin.from('consent_requests').insert([
      {
        patient_id: P, requestor_id: H,
        purpose: 'Initial consultation and treatment planning',
        scope: ['medical_records', 'prescriptions'],
        expires_at: fwd(365), status: 'approved', created_at: ago(11),
      },
      {
        patient_id: P, requestor_id: I,
        purpose: 'Verification for insurance claim #INS-2024-0042',
        scope: ['medical_records', 'prescriptions', 'lab_results'],
        expires_at: fwd(30), status: 'pending', created_at: ago(2),
      },
      {
        patient_id: P, requestor_id: PH,
        purpose: 'Access to prescription history for safe dispensing',
        scope: ['prescriptions'],
        expires_at: fwd(90), status: 'pending', created_at: ago(1),
      },
    ]);
    log.push('consent_requests inserted');

    // ── Step 8: Pharmacy dispensings ──────────────────────────────────────────
    await admin.from('pharmacy_dispensings').insert([
      { prescription_id: rx3, pharmacy_id: PH, quantity_dispensed: 21, refills_remaining: 0, dispensed_at: ago(55) },
    ]);
    log.push('pharmacy_dispensings inserted');

    // ── Step 9: Insurance claims ──────────────────────────────────────────────
    const claim1 = crypto.randomUUID();
    await admin.from('insurance_claims').insert([
      { id: claim1, insurance_id: I, patient_id: P, claim_amount: 1250.00, status: 'submitted', created_at: ago(3) },
      { insurance_id: I, patient_id: P, claim_amount: 340.00, status: 'approved', created_at: ago(20) },
    ]);
    log.push('insurance_claims inserted');

    // ── Step 10: Verification requests ───────────────────────────────────────
    await admin.from('verification_requests').insert([
      {
        insurance_id: I, patient_id: P, claim_id: claim1,
        requested_data_scope: ['medical_records', 'prescriptions', 'lab_results'],
        status: 'pending', created_at: ago(2),
      },
    ]);
    log.push('verification_requests inserted');

    // ── Step 11: AI insights ──────────────────────────────────────────────────
    await admin.from('ai_insights').insert([
      {
        patient_id: P, type: 'drug_interaction', severity: 'medium', created_at: ago(1),
        message: 'Potential interaction: Metformin + Lisinopril may increase hypoglycemia risk.',
        recommendation: 'Monitor blood glucose more frequently.',
        source_model: 'llama-3.3-70b-versatile',
      },
      {
        patient_id: P, type: 'medication_adherence', severity: 'low', created_at: ago(3),
        message: 'Lisinopril refill due in 7 days.',
        recommendation: 'Contact Metro Pharmacy or use the portal to initiate refill.',
        source_model: 'llama-3.3-70b-versatile',
      },
      {
        patient_id: P, type: 'lab_follow_up', severity: 'low', created_at: ago(5),
        message: 'HbA1c of 7.2% is above target. Follow-up lab in 3 months.',
        recommendation: 'Maintain low-carb diet.',
        source_model: 'llama-3.3-70b-versatile',
      },
    ]);
    log.push('ai_insights inserted');

    // ── Step 12: Fraud alerts ─────────────────────────────────────────────────
    await admin.from('fraud_alerts').insert([
      {
        patient_id: P, fraud_score: 62,
        indicator: 'Duplicate prescription pattern detected',
        explanation: 'Two prescriptions for controlled substance with overlapping fill periods.',
        affected_data: ['prescriptions'],
        created_at: ago(2),
      },
    ]);
    log.push('fraud_alerts inserted');

    // ── Step 13: Audit logs ───────────────────────────────────────────────────
    await admin.from('audit_logs').insert([
      { actor_id: H,  actor_role: 'HOSPITAL',  action: 'READ_MEDICAL_RECORDS', target_id: P,  scope: ['medical_records'],                 result: 'success', timestamp: ago(10) },
      { actor_id: H,  actor_role: 'HOSPITAL',  action: 'CREATE_PRESCRIPTION',  target_id: P,  scope: ['prescriptions'],                    result: 'success', timestamp: ago(10) },
      { actor_id: PH, actor_role: 'PHARMACY',  action: 'VERIFY_PRESCRIPTION',  target_id: P,  scope: ['prescriptions'],                    result: 'success', timestamp: ago(55) },
      { actor_id: PH, actor_role: 'PHARMACY',  action: 'DISPENSE_MEDICATION',  target_id: P,  scope: ['prescriptions'],                    result: 'success', timestamp: ago(55) },
      { actor_id: I,  actor_role: 'INSURANCE', action: 'REQUEST_VERIFICATION', target_id: P,  scope: ['medical_records', 'prescriptions'], result: 'success', timestamp: ago(2)  },
      { actor_id: P,  actor_role: 'PATIENT',   action: 'GRANT_CONSENT',        target_id: H,  scope: ['medical_records', 'prescriptions'], result: 'success', timestamp: ago(10) },
      { actor_id: P,  actor_role: 'PATIENT',   action: 'GRANT_CONSENT',        target_id: PH, scope: ['prescriptions'],                    result: 'success', timestamp: ago(5)  },
      { actor_id: P,  actor_role: 'PATIENT',   action: 'VIEW_AUDIT_LOG',       target_id: P,  scope: ['audit_logs'],                       result: 'success', timestamp: ago(1)  },
    ]);
    log.push('audit_logs inserted');

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded. All passwords: Demo@1234',
      accounts: DEMOS.map(d => ({ email: d.email, role: d.role, id: ids[d.role] })),
      log,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[seed]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

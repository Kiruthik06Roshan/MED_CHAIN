-- ============================================================
-- MedChain Demo Seed Data
-- Run this in the Supabase SQL editor AFTER 001_initial_schema.sql
--
-- !! DO NOT USE THIS TO CREATE AUTH USERS !!
-- Direct SQL inserts into auth.users cause Supabase 500 errors on sign-in.
--
-- Instead, start the dev server and call:
--   POST http://localhost:3001/api/seed
-- (or use curl: curl -X POST http://localhost:3001/api/seed)
--
-- That endpoint uses the Supabase Admin SDK to create users correctly,
-- then inserts all the demo application data automatically.
-- ============================================================

DO $$
DECLARE
  v_patient_id   uuid := 'a1000000-0000-0000-0000-000000000001';
  v_hospital_id  uuid := 'a1000000-0000-0000-0000-000000000002';
  v_pharmacy_id  uuid := 'a1000000-0000-0000-0000-000000000003';
  v_insurance_id uuid := 'a1000000-0000-0000-0000-000000000004';
  v_admin_id     uuid := 'a1000000-0000-0000-0000-000000000005';

  v_consent1_id  uuid := gen_random_uuid();
  v_consent2_id  uuid := gen_random_uuid();
  v_rx1_id       uuid := gen_random_uuid();
  v_rx2_id       uuid := gen_random_uuid();
  v_rx3_id       uuid := gen_random_uuid();
  v_claim1_id    uuid := gen_random_uuid();
BEGIN

  -- ==============================================================
  -- 1. AUTH USERS  (creates login credentials)
  -- ==============================================================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data,
    created_at, updated_at, is_sso_user, is_anonymous
  ) VALUES
    (v_patient_id,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'patient@demo.medchain',
     crypt('Demo@1234', gen_salt('bf')), now(),
     '{"full_name":"John Smith","role":"PATIENT"}'::jsonb,
     now(), now(), false, false),

    (v_hospital_id,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'hospital@demo.medchain',
     crypt('Demo@1234', gen_salt('bf')), now(),
     '{"full_name":"Dr. Emily Chen","role":"HOSPITAL","organization_name":"City General Hospital"}'::jsonb,
     now(), now(), false, false),

    (v_pharmacy_id,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'pharmacy@demo.medchain',
     crypt('Demo@1234', gen_salt('bf')), now(),
     '{"full_name":"Metro Pharmacy","role":"PHARMACY","organization_name":"Metro Pharmacy"}'::jsonb,
     now(), now(), false, false),

    (v_insurance_id,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'insurance@demo.medchain',
     crypt('Demo@1234', gen_salt('bf')), now(),
     '{"full_name":"HealthShield Agent","role":"INSURANCE","organization_name":"HealthShield Insurance"}'::jsonb,
     now(), now(), false, false),

    (v_admin_id,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@demo.medchain',
     crypt('Demo@1234', gen_salt('bf')), now(),
     '{"full_name":"System Admin","role":"ADMIN"}'::jsonb,
     now(), now(), false, false)
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 2. AUTH IDENTITIES  (needed for email+password login)
  --
  -- Supabase >=2024 schema:
  --   id          uuid  DEFAULT gen_random_uuid()   ← auto, do NOT specify
  --   provider_id text  NOT NULL                    ← the external identifier
  --   user_id     uuid  NOT NULL
  --   identity_data jsonb NOT NULL
  --   provider    text  NOT NULL
  --   email       text  GENERATED ALWAYS            ← do NOT specify
  --   UNIQUE (provider_id, provider)
  -- ==============================================================
  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (v_patient_id::text,   v_patient_id,
     jsonb_build_object('sub', v_patient_id::text, 'email', 'patient@demo.medchain'),
     'email', now(), now(), now()),

    (v_hospital_id::text,  v_hospital_id,
     jsonb_build_object('sub', v_hospital_id::text, 'email', 'hospital@demo.medchain'),
     'email', now(), now(), now()),

    (v_pharmacy_id::text,  v_pharmacy_id,
     jsonb_build_object('sub', v_pharmacy_id::text, 'email', 'pharmacy@demo.medchain'),
     'email', now(), now(), now()),

    (v_insurance_id::text, v_insurance_id,
     jsonb_build_object('sub', v_insurance_id::text, 'email', 'insurance@demo.medchain'),
     'email', now(), now(), now()),

    (v_admin_id::text,     v_admin_id,
     jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@demo.medchain'),
     'email', now(), now(), now())
  ON CONFLICT (provider_id, provider) DO NOTHING;

  -- ==============================================================
  -- 3. USER PROFILES
  -- ==============================================================
  INSERT INTO public.user_profiles (
    id, email, full_name, role, organization_name, created_at, updated_at
  ) VALUES
    (v_patient_id,   'patient@demo.medchain',   'John Smith',          'PATIENT',   null,                     now(), now()),
    (v_hospital_id,  'hospital@demo.medchain',  'Dr. Emily Chen',      'HOSPITAL',  'City General Hospital',  now(), now()),
    (v_pharmacy_id,  'pharmacy@demo.medchain',  'Metro Pharmacy',      'PHARMACY',  'Metro Pharmacy',         now(), now()),
    (v_insurance_id, 'insurance@demo.medchain', 'HealthShield Agent',  'INSURANCE', 'HealthShield Insurance', now(), now()),
    (v_admin_id,     'admin@demo.medchain',     'System Admin',        'ADMIN',     null,                     now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 4. PRESCRIPTIONS
  -- ==============================================================
  INSERT INTO public.prescriptions (
    id, patient_id, prescriber_id, medication, dosage, quantity,
    refills, date_issued, expiry_date, notes, status, created_at
  ) VALUES
    (v_rx1_id, v_patient_id, v_hospital_id,
     'Metformin', '500mg twice daily', 60, 3,
     now() - interval '10 days', now() + interval '6 months',
     'Take with meals. Monitor blood glucose weekly.', 'active', now() - interval '10 days'),

    (v_rx2_id, v_patient_id, v_hospital_id,
     'Lisinopril', '10mg once daily', 30, 5,
     now() - interval '30 days', now() + interval '11 months',
     'Take in the morning. Avoid potassium supplements.', 'active', now() - interval '30 days'),

    (v_rx3_id, v_patient_id, v_hospital_id,
     'Amoxicillin', '250mg three times daily', 21, 0,
     now() - interval '60 days', now() - interval '15 days',
     'Complete full course. Do not stop early.', 'filled', now() - interval '60 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 5. MEDICAL RECORDS
  -- ==============================================================
  INSERT INTO public.medical_records (
    id, patient_id, type, data, created_at
  ) VALUES
    (gen_random_uuid(), v_patient_id, 'lab',
     '{"title":"HbA1c Panel","provider":"City General Lab","result":"7.2%","reference":"<7.0%","interpretation":"Slightly elevated — follow-up in 3 months","ordered_by":"Dr. Emily Chen"}'::jsonb,
     now() - interval '5 days'),

    (gen_random_uuid(), v_patient_id, 'lab',
     '{"title":"Comprehensive Metabolic Panel","provider":"City General Lab","result":"Normal","cholesterol":"185 mg/dL","creatinine":"0.9 mg/dL","eGFR":">60","ordered_by":"Dr. Emily Chen"}'::jsonb,
     now() - interval '5 days'),

    (gen_random_uuid(), v_patient_id, 'encounter',
     '{"title":"Annual Physical Examination","provider":"City General Hospital","physician":"Dr. Emily Chen","chief_complaint":"Annual checkup","assessment":"Type 2 Diabetes — well controlled. Hypertension — stable on current regimen.","plan":"Continue current medications. Repeat HbA1c in 3 months. Low-sodium diet."}'::jsonb,
     now() - interval '10 days'),

    (gen_random_uuid(), v_patient_id, 'note',
     '{"title":"Patient Care Note","author":"Dr. Emily Chen","content":"Patient reports good medication adherence. No adverse effects noted. Blood pressure 128/82 mmHg today. Weight stable. Discussed importance of dietary modifications."}'::jsonb,
     now() - interval '10 days'),

    (gen_random_uuid(), v_patient_id, 'attachment',
     '{"title":"Chest X-Ray","modality":"X-Ray","findings":"No acute cardiopulmonary process. Heart size normal. Lungs clear.","radiologist":"Dr. Mark Lee","facility":"City General Radiology"}'::jsonb,
     now() - interval '20 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 6. CONSENTS  (patient granted hospital + pharmacy access)
  -- ==============================================================
  INSERT INTO public.consents (
    id, patient_id, grantee_id, purpose,
    scope, is_active, expires_at, granted_at
  ) VALUES
    (v_consent1_id, v_patient_id, v_hospital_id,
     'Ongoing care and treatment by City General Hospital',
     ARRAY['medical_records','prescriptions','lab_results'],
     true, now() + interval '1 year', now() - interval '10 days'),

    (v_consent2_id, v_patient_id, v_pharmacy_id,
     'Prescription dispensing and medication history review',
     ARRAY['prescriptions'],
     true, now() + interval '6 months', now() - interval '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 7. CONSENT REQUESTS
  -- ==============================================================
  INSERT INTO public.consent_requests (
    id, patient_id, requestor_id, purpose, scope,
    expires_at, status, created_at
  ) VALUES
    -- Approved request (hospital)
    (gen_random_uuid(), v_patient_id, v_hospital_id,
     'Initial consultation and treatment planning',
     ARRAY['medical_records','prescriptions'],
     now() + interval '1 year', 'approved', now() - interval '11 days'),

    -- Pending request (insurance)
    (gen_random_uuid(), v_patient_id, v_insurance_id,
     'Verification of treatment for insurance claim #INS-2024-0042',
     ARRAY['medical_records','prescriptions','lab_results'],
     now() + interval '30 days', 'pending', now() - interval '2 days'),

    -- Pending request (pharmacy)
    (gen_random_uuid(), v_patient_id, v_pharmacy_id,
     'Access to prescription history for safe dispensing',
     ARRAY['prescriptions'],
     now() + interval '3 months', 'pending', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 8. PHARMACY DISPENSINGS
  -- ==============================================================
  INSERT INTO public.pharmacy_dispensings (
    id, prescription_id, pharmacy_id,
    quantity_dispensed, refills_remaining, dispensed_at
  ) VALUES
    (gen_random_uuid(), v_rx3_id, v_pharmacy_id,
     21, 0, now() - interval '55 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 9. INSURANCE CLAIMS
  -- ==============================================================
  INSERT INTO public.insurance_claims (
    id, insurance_id, patient_id,
    claim_amount, status, created_at
  ) VALUES
    (v_claim1_id, v_insurance_id, v_patient_id,
     1250.00, 'submitted', now() - interval '3 days'),

    (gen_random_uuid(), v_insurance_id, v_patient_id,
     340.00, 'approved', now() - interval '20 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 10. VERIFICATION REQUESTS
  -- ==============================================================
  INSERT INTO public.verification_requests (
    id, insurance_id, patient_id, claim_id,
    requested_data_scope, status, created_at
  ) VALUES
    (gen_random_uuid(), v_insurance_id, v_patient_id, v_claim1_id,
     ARRAY['medical_records','prescriptions','lab_results'],
     'pending', now() - interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 11. AI INSIGHTS
  -- ==============================================================
  INSERT INTO public.ai_insights (
    id, patient_id, type, severity, message,
    recommendation, source_model, created_at
  ) VALUES
    (gen_random_uuid(), v_patient_id,
     'drug_interaction', 'medium',
     'Potential interaction detected: Metformin + Lisinopril may increase hypoglycemia risk.',
     'Monitor blood glucose more frequently. Discuss dosage timing with your physician.',
     'llama-3.3-70b-versatile', now() - interval '1 day'),

    (gen_random_uuid(), v_patient_id,
     'medication_adherence', 'low',
     'Prescription refill window approaching: Lisinopril refill due in 7 days.',
     'Contact Metro Pharmacy or your portal to initiate refill before running out.',
     'llama-3.3-70b-versatile', now() - interval '3 days'),

    (gen_random_uuid(), v_patient_id,
     'lab_follow_up', 'low',
     'HbA1c of 7.2% is above target range. Follow-up lab recommended in 3 months.',
     'Maintain low-carb diet. Your care team has scheduled a follow-up for next quarter.',
     'llama-3.3-70b-versatile', now() - interval '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 12. FRAUD ALERTS
  -- ==============================================================
  INSERT INTO public.fraud_alerts (
    id, patient_id, fraud_score, indicator,
    explanation, affected_data, created_at
  ) VALUES
    (gen_random_uuid(), v_patient_id,
     62, 'Duplicate prescription pattern detected',
     'Two prescriptions for controlled substance with overlapping fill periods detected across different providers.',
     ARRAY['prescriptions'], now() - interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- ==============================================================
  -- 13. AUDIT LOGS
  -- ==============================================================
  INSERT INTO public.audit_logs (
    id, actor_id, actor_role, action, target_id,
    scope, result, timestamp
  ) VALUES
    (gen_random_uuid(), v_hospital_id, 'HOSPITAL', 'READ_MEDICAL_RECORDS', v_patient_id,
     ARRAY['medical_records'], 'success', now() - interval '10 days'),

    (gen_random_uuid(), v_hospital_id, 'HOSPITAL', 'CREATE_PRESCRIPTION', v_patient_id,
     ARRAY['prescriptions'], 'success', now() - interval '10 days'),

    (gen_random_uuid(), v_pharmacy_id, 'PHARMACY', 'VERIFY_PRESCRIPTION', v_patient_id,
     ARRAY['prescriptions'], 'success', now() - interval '55 days'),

    (gen_random_uuid(), v_pharmacy_id, 'PHARMACY', 'DISPENSE_MEDICATION', v_patient_id,
     ARRAY['prescriptions'], 'success', now() - interval '55 days'),

    (gen_random_uuid(), v_insurance_id, 'INSURANCE', 'REQUEST_VERIFICATION', v_patient_id,
     ARRAY['medical_records','prescriptions'], 'success', now() - interval '2 days'),

    (gen_random_uuid(), v_patient_id, 'PATIENT', 'GRANT_CONSENT', v_hospital_id,
     ARRAY['medical_records','prescriptions'], 'success', now() - interval '10 days'),

    (gen_random_uuid(), v_patient_id, 'PATIENT', 'GRANT_CONSENT', v_pharmacy_id,
     ARRAY['prescriptions'], 'success', now() - interval '5 days'),

    (gen_random_uuid(), v_patient_id, 'PATIENT', 'VIEW_AUDIT_LOG', v_patient_id,
     ARRAY['audit_logs'], 'success', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

END;
$$;

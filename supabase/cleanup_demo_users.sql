-- ============================================================
-- Cleanup: delete all @demo.medchain users and their data
-- Run this in the Supabase SQL editor, then call POST /api/seed
-- ============================================================

DO $$
DECLARE
  demo_ids uuid[];
BEGIN
  -- Collect the IDs of all demo users
  SELECT ARRAY(
    SELECT id FROM auth.users WHERE email LIKE '%@demo.medchain'
  ) INTO demo_ids;

  IF array_length(demo_ids, 1) IS NULL THEN
    RAISE NOTICE 'No demo users found — nothing to delete.';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting % demo user(s)...', array_length(demo_ids, 1);

  -- ── Public application data (children first) ─────────────────────────────
  DELETE FROM public.audit_logs           WHERE actor_id  = ANY(demo_ids) OR target_id = ANY(demo_ids);
  DELETE FROM public.fraud_alerts         WHERE patient_id = ANY(demo_ids);
  DELETE FROM public.ai_insights          WHERE patient_id = ANY(demo_ids);
  DELETE FROM public.verification_requests WHERE patient_id = ANY(demo_ids) OR insurance_id = ANY(demo_ids);
  DELETE FROM public.insurance_claims     WHERE patient_id = ANY(demo_ids) OR insurance_id = ANY(demo_ids);
  DELETE FROM public.pharmacy_dispensings WHERE pharmacy_id = ANY(demo_ids)
                                            OR prescription_id IN (
                                              SELECT id FROM public.prescriptions WHERE patient_id = ANY(demo_ids)
                                            );
  DELETE FROM public.consent_requests     WHERE patient_id = ANY(demo_ids) OR requestor_id = ANY(demo_ids);
  DELETE FROM public.consents             WHERE patient_id = ANY(demo_ids) OR grantee_id    = ANY(demo_ids);
  DELETE FROM public.medical_records      WHERE patient_id = ANY(demo_ids);
  DELETE FROM public.prescriptions        WHERE patient_id = ANY(demo_ids) OR prescriber_id = ANY(demo_ids);
  DELETE FROM public.user_profiles        WHERE id = ANY(demo_ids);

  -- ── Supabase auth tables (must come before auth.users) ───────────────────
  DELETE FROM auth.mfa_amr_claims  WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = ANY(demo_ids));
  DELETE FROM auth.sessions        WHERE user_id = ANY(demo_ids);
  DELETE FROM auth.refresh_tokens  WHERE user_id = ANY(demo_ids);
  DELETE FROM auth.mfa_factors     WHERE user_id = ANY(demo_ids);
  DELETE FROM auth.identities      WHERE user_id = ANY(demo_ids);
  DELETE FROM auth.one_time_tokens WHERE user_id = ANY(demo_ids);

  -- ── Finally delete the auth users themselves ──────────────────────────────
  DELETE FROM auth.users WHERE id = ANY(demo_ids);

  RAISE NOTICE 'Done. % demo user(s) and all related data deleted.', array_length(demo_ids, 1);
END;
$$;

-- MedChain Initial Schema
-- Run this entire block in your Supabase SQL editor.
-- Tables are created first, then RLS is enabled, then all policies are added.
-- This avoids forward-reference errors in policy USING expressions.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('PATIENT','HOSPITAL','PHARMACY','INSURANCE','ADMIN')),
  wallet_address text,
  organization_name text,
  phone text,
  avatar_url text,
  is_disabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references user_profiles(id) on delete cascade,
  type text not null check (type in ('prescription','lab','note','encounter','attachment')),
  data jsonb not null default '{}',
  signature_proof jsonb,
  created_at timestamptz default now()
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references user_profiles(id) on delete cascade,
  prescriber_id uuid references user_profiles(id),
  medication text not null,
  dosage text not null,
  quantity integer not null default 30,
  refills integer not null default 0,
  date_issued timestamptz default now(),
  expiry_date timestamptz not null,
  notes text,
  status text not null default 'active' check (status in ('active','filled','expired','cancelled')),
  signature_proof jsonb,
  created_at timestamptz default now()
);

create table if not exists consent_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references user_profiles(id) on delete cascade,
  requestor_id uuid references user_profiles(id),
  purpose text not null,
  scope text[] not null default '{}',
  data_categories text[] default '{}',
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','approved','denied','expired')),
  created_at timestamptz default now()
);

-- consents must exist before policies that reference it (e.g. medical_records policy)
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references user_profiles(id) on delete cascade,
  grantee_id uuid references user_profiles(id),
  purpose text not null,
  scope text[] not null default '{}',
  signed_payload jsonb,
  blockchain_tx_hash text,
  signature_proof jsonb,
  is_active boolean not null default true,
  expires_at timestamptz not null,
  granted_at timestamptz default now(),
  revoked_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  target_id uuid,
  scope text[] default '{}',
  result text not null check (result in ('success','failure','denied')),
  tx_hash text,
  ip_address text,
  timestamp timestamptz default now()
);

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references user_profiles(id) on delete cascade,
  type text not null,
  severity text not null,
  message text not null,
  recommendation text,
  source_model text,
  dismissed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references user_profiles(id) on delete cascade,
  fraud_score integer not null,
  indicator text not null,
  explanation text,
  affected_data text[] default '{}',
  triaged_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists pharmacy_dispensings (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid references prescriptions(id),
  pharmacy_id uuid references user_profiles(id),
  quantity_dispensed integer not null,
  refills_remaining integer not null default 0,
  dispensed_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists insurance_claims (
  id uuid primary key default gen_random_uuid(),
  insurance_id uuid references user_profiles(id),
  patient_id uuid references user_profiles(id),
  claim_amount numeric(10,2) not null,
  status text not null default 'submitted' check (status in ('submitted','verified','approved','denied')),
  created_at timestamptz default now()
);

create table if not exists verification_requests (
  id uuid primary key default gen_random_uuid(),
  insurance_id uuid references user_profiles(id),
  patient_id uuid references user_profiles(id),
  claim_id uuid references insurance_claims(id),
  requested_data_scope text[] default '{}',
  approved_data_scope text[] default '{}',
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz default now()
);

create table if not exists feature_flags (
  flag_name text primary key,
  enabled boolean not null default true,
  updated_at timestamptz default now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table user_profiles         enable row level security;
alter table medical_records       enable row level security;
alter table prescriptions         enable row level security;
alter table consent_requests      enable row level security;
alter table consents              enable row level security;
alter table audit_logs            enable row level security;
alter table ai_insights           enable row level security;
alter table fraud_alerts          enable row level security;
alter table pharmacy_dispensings  enable row level security;
alter table insurance_claims      enable row level security;
alter table verification_requests enable row level security;

-- ============================================================
-- POLICIES — user_profiles
-- ============================================================

create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on user_profiles for select
  using (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'ADMIN'
  ));

-- ============================================================
-- POLICIES — medical_records
-- (consents table is already created above, so this is safe)
-- ============================================================

create policy "Patients can read own records"
  on medical_records for select
  using (auth.uid() = patient_id);

create policy "Providers with consent can read records"
  on medical_records for select
  using (exists (
    select 1 from consents c
    where c.grantee_id = auth.uid()
      and c.patient_id = medical_records.patient_id
      and c.is_active = true
      and c.expires_at > now()
  ));

create policy "Hospitals can insert records"
  on medical_records for insert
  with check (exists (
    select 1 from user_profiles up
    where up.id = auth.uid() and up.role = 'HOSPITAL'
  ));

-- ============================================================
-- POLICIES — prescriptions
-- ============================================================

create policy "Patients can read own prescriptions"
  on prescriptions for select
  using (auth.uid() = patient_id);

create policy "Prescribers can read prescriptions they created"
  on prescriptions for select
  using (auth.uid() = prescriber_id);

create policy "Hospitals can create prescriptions"
  on prescriptions for insert
  with check (auth.uid() = prescriber_id);

create policy "Hospitals can update prescriptions they created"
  on prescriptions for update
  using (auth.uid() = prescriber_id);

create policy "Pharmacies can update prescription status"
  on prescriptions for update
  using (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'PHARMACY'
  ));

-- ============================================================
-- POLICIES — consent_requests
-- ============================================================

create policy "Patients can read requests addressed to them"
  on consent_requests for select
  using (auth.uid() = patient_id);

create policy "Requestors can read their own requests"
  on consent_requests for select
  using (auth.uid() = requestor_id);

create policy "Requestors can create requests"
  on consent_requests for insert
  with check (auth.uid() = requestor_id);

create policy "Patients can update request status"
  on consent_requests for update
  using (auth.uid() = patient_id);

-- ============================================================
-- POLICIES — consents
-- ============================================================

create policy "Patients can read and manage own consents"
  on consents for all
  using (auth.uid() = patient_id);

create policy "Grantees can read consents granted to them"
  on consents for select
  using (auth.uid() = grantee_id);

create policy "Service role can insert consents"
  on consents for insert
  with check (true);

-- ============================================================
-- POLICIES — audit_logs
-- ============================================================

create policy "Patients can read audit events targeting them"
  on audit_logs for select
  using (auth.uid() = target_id);

create policy "Actors can read their own audit events"
  on audit_logs for select
  using (auth.uid() = actor_id);

create policy "Admins can read all audit logs"
  on audit_logs for select
  using (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'ADMIN'
  ));

create policy "Anyone authenticated can insert audit logs"
  on audit_logs for insert
  with check (auth.uid() is not null);

-- ============================================================
-- POLICIES — ai_insights
-- ============================================================

create policy "Patients can read and dismiss own insights"
  on ai_insights for all
  using (auth.uid() = patient_id);

create policy "Service role can insert insights"
  on ai_insights for insert
  with check (true);

-- ============================================================
-- POLICIES — fraud_alerts
-- ============================================================

create policy "Patients can read own fraud alerts"
  on fraud_alerts for select
  using (auth.uid() = patient_id);

create policy "Admins can read all fraud alerts"
  on fraud_alerts for select
  using (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'ADMIN'
  ));

create policy "Service role can insert fraud alerts"
  on fraud_alerts for insert
  with check (true);

-- ============================================================
-- POLICIES — pharmacy_dispensings
-- ============================================================

create policy "Pharmacies can manage their dispensings"
  on pharmacy_dispensings for all
  using (auth.uid() = pharmacy_id);

create policy "Pharmacies can insert dispensings"
  on pharmacy_dispensings for insert
  with check (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'PHARMACY'
  ));

-- ============================================================
-- POLICIES — insurance_claims
-- ============================================================

create policy "Insurance can manage own claims"
  on insurance_claims for all
  using (auth.uid() = insurance_id);

create policy "Insurance can insert claims"
  on insurance_claims for insert
  with check (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'INSURANCE'
  ));

-- ============================================================
-- POLICIES — verification_requests
-- ============================================================

create policy "Insurance can read own verification requests"
  on verification_requests for select
  using (auth.uid() = insurance_id);

create policy "Patients can read verification requests for them"
  on verification_requests for select
  using (auth.uid() = patient_id);

create policy "Insurance can insert verification requests"
  on verification_requests for insert
  with check (exists (
    select 1 from user_profiles up where up.id = auth.uid() and up.role = 'INSURANCE'
  ));

create policy "Patients can update verification request status"
  on verification_requests for update
  using (auth.uid() = patient_id);

-- ============================================================
-- TRIGGER — auto-create user profile on signup
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, role, organization_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'PATIENT'),
    new.raw_user_meta_data->>'organization_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- SEED DATA — feature flags
-- ============================================================

insert into feature_flags (flag_name, enabled) values
  ('ai_insights',              true),
  ('fraud_detection',          true),
  ('blockchain_verification',  true),
  ('google_auth',              false)
on conflict (flag_name) do nothing;

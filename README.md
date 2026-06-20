# MedChain — Blockchain-Secured Healthcare Data Platform

> Hackathon prototype · Next.js 15 · Supabase · Ethereum Sepolia · Groq AI

MedChain gives patients cryptographic control over their medical records. Every data access requires explicit patient consent, is signed on the Ethereum blockchain, and is logged in an immutable audit trail.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in the values described in the Environment section below

# 3. Run Supabase migration (paste in Supabase SQL editor)
#    supabase/migrations/001_initial_schema.sql

# 4. Load demo data (paste in Supabase SQL editor)
#    supabase/seed.sql

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

After running `supabase/seed.sql`, these accounts are ready.
**All passwords: `Demo@1234`**

| Role | Email | Portal URL |
|------|-------|-----------|
| Patient | `patient@demo.medchain` | `/patient` |
| Hospital | `hospital@demo.medchain` | `/hospital` |
| Pharmacy | `pharmacy@demo.medchain` | `/pharmacy` |
| Insurance | `insurance@demo.medchain` | `/insurance` |
| Admin | `admin@demo.medchain` | `/admin` |

---

## User Roles and Capabilities

### PATIENT
The central actor. Patients own their data and control who can access it.

**What they can do:**
- View their complete **Health Vault** (medical records, lab results, imaging)
- View and track **Prescriptions** (active, filled, expired)
- Browse **Medical History** (encounters, notes, attachments)
- Manage the **Consent Center** — grant or revoke provider access with a cryptographic MetaMask signature
- Approve or deny **Access Requests** from hospitals, pharmacies, and insurers
- Review the full **Audit Log** — every read and write against their data with timestamps
- View **AI Safety Insights** — drug interaction warnings, adherence reminders, lab follow-up alerts
- Connect a **MetaMask wallet** for on-chain consent signing and verification

**Data isolation:** All API routes enforce `patient_id = auth.uid()` via PostgreSQL Row Level Security. A patient can never see another patient's data.

---

### HOSPITAL / CLINIC
Represents a licensed healthcare provider.

**What they can do:**
- **Search patients** by name or email
- **Request patient consent** — sends a structured consent request the patient must approve
- **Create prescriptions** — only allowed if active consent exists
- View and manage **Consent Requests** (pending, approved, denied)
- **Verify** patient-consent records and signature proofs on-chain

**Consent gate:** A hospital can only create a prescription or read medical records if there is an active, non-expired row in the `consents` table where `grantee_id = hospital_id`. Without consent, every write attempt returns HTTP 403 Forbidden.

---

### PHARMACY
Represents a dispensing pharmacy.

**What they can do:**
- **Verify prescriptions** by ID — checks prescription status, active consent, and optional on-chain verification
- **Dispense medication** — creates a dispensing record, decrements refills, marks prescription `filled` when exhausted
- View **Active Prescriptions** for consented patients only
- Browse **Dispensing Inventory** and history
- Review their **Audit Log**

**Safety checks before dispensing:**
1. Prescription must be `active` (not expired or cancelled)
2. Refills remaining must be > 0
3. Pharmacy must hold active consent for that patient
4. Dispensing is recorded on-chain (if blockchain verification is enabled)

---

### INSURANCE
Represents an insurance provider.

**What they can do:**
- Submit **Claims** (linked to a patient)
- Create **Verification Requests** — requests specific data scopes from a patient (automatically generates a consent request the patient must approve)
- View claim and verification request statuses
- Review their **Audit Log**

**Data gate:** Insurance cannot directly read patient records. They must request verification, the patient approves (with a scoped consent), and only the approved data categories are accessible.

---

### ADMIN
Platform administrator with global visibility.

**What they can do:**
- **Dashboard overview** — user counts, consent totals, audit activity, system health
- **Analytics charts** — prescription trends, consent activity over time (line, bar, pie charts)
- **Network Monitoring** — live blockchain network status, MetaMask connection
- **Fraud Detection** — review AI-flagged alerts, triage or dismiss them
- **User Management** — list all users, disable compromised accounts
- **Full Audit Log** — every event across all actors
- **Feature Flags** — toggle AI insights, fraud detection, blockchain verification, Google OAuth

**Authorization:** Every admin API route checks `role = 'ADMIN'` server-side before proceeding. There is no client-side role bypass.

---

## System Flow

### Signup and Login

```
Signup:
  User fills form (name, email, role, password)
    └─ Supabase Auth creates auth.users row
         └─ DB trigger fires → creates user_profiles row with metadata
              └─ Email confirmation disabled → session returned → redirect to /[role-portal]
              └─ Email confirmation enabled → user clicks email link
                   └─ /auth/callback exchanges code → redirect to /[role-portal]

Login:
  signInWithPassword
    └─ POST /api/auth/sync-profile
         └─ Ensures user_profiles row exists (creates via admin client if missing)
         └─ Returns confirmed role
    └─ window.location.href = /[role-portal]

Middleware (every request):
  Unauthenticated + protected route → /auth/login?redirectTo=...
  Authenticated + public/auth page  → /[role-portal]
    (uses DB role, falls back to JWT metadata if profile row is missing)
```

### Consent-Gated Data Flow

```
Hospital wants to prescribe for a patient:

1. Hospital searches patient → no consent exists
2. Hospital creates consent request → POST /api/hospital/consent-requests
3. Patient sees pending request on /patient/access-requests
4. Patient clicks "Approve"
5. Consent dialog opens → patient reviews scope + expiry
6. MetaMask prompts patient to sign (EIP-191 personal_sign)
7. Signature split into {v, r, s} → POST /api/patient/consent/sign
   └─ consent_request.status = 'approved'
   └─ consents row created with signature_proof + blockchain_tx_hash
8. Hospital can now create prescriptions → POST /api/hospital/prescriptions
   (API verifies active consent before writing)

Pharmacy dispenses:
1. GET /api/pharmacy/prescriptions → only prescriptions with active patient consent
2. Pharmacist clicks Dispense → POST /api/pharmacy/dispense
   └─ Checks: prescription active? refills > 0? consent active?
   └─ Creates pharmacy_dispensings record
   └─ Updates prescription status
   └─ Writes audit_log row
```

### AI Insights Flow

```
Patient visits /patient/insights:
  GET /api/ai/insights
    └─ Fetches current prescriptions + recent records
    └─ Sends structured prompt to Groq (llama-3.3-70b-versatile)
    └─ Returns: severity + message + recommendation per issue
    └─ Stored in ai_insights table

  GET /api/ai/fraud-detection
    └─ Fetches complete prescription history
    └─ Groq analyzes for anomalies (duplicates, unusual patterns)
    └─ Returns: fraud_score (0-100) + indicator + explanation
```

### Audit Trail

Every data access writes to `audit_logs`:

| Field | Example |
|-------|---------|
| `actor_id` | UUID of requesting user |
| `actor_role` | `HOSPITAL` |
| `action` | `CREATE_PRESCRIPTION` |
| `target_id` | Patient UUID |
| `scope` | `['prescriptions', 'medical_records']` |
| `result` | `success` / `failure` / `denied` |
| `tx_hash` | Ethereum tx hash (when on-chain) |
| `timestamp` | UTC ISO timestamp |

---

## Backend Implementation

### Database — Supabase (PostgreSQL)

**12 tables with Row Level Security:**

| Table | Purpose |
|-------|---------|
| `user_profiles` | Extended user data, role, wallet address |
| `medical_records` | Patient health records (JSONB flexible schema) |
| `prescriptions` | Prescription lifecycle tracking |
| `consent_requests` | Pending provider access requests |
| `consents` | Active grants with cryptographic signature proof |
| `audit_logs` | Immutable access event log |
| `ai_insights` | AI-generated safety alerts |
| `fraud_alerts` | AI fraud detection flags |
| `pharmacy_dispensings` | Dispensing records with refill tracking |
| `insurance_claims` | Insurance claim submissions |
| `verification_requests` | Insurance data verification requests |
| `feature_flags` | Admin-controlled feature toggles |

**Row Level Security policies:**
- Patients can only read their own rows
- Providers can only access rows where an active consent exists
- Admins can read all rows
- Insert/update restricted by role and record ownership

**Auto-provisioning:** `on_auth_user_created` trigger creates a `user_profiles` row from signup metadata on every new auth user.

---

### API Routes — Next.js App Router

All routes live in `src/app/api/`. Each route:
1. Creates a server Supabase client from request cookies (session validated server-side)
2. Calls `supabase.auth.getUser()` — JWT-verified, cannot be spoofed
3. Checks role for authorization
4. Executes database queries (with RLS active)
5. Writes an audit log entry on sensitive operations

**Endpoints by portal:**

```
/api/auth/
  sync-profile      POST  Upsert user profile after login (admin client)
  logout            POST  Sign out + redirect

/api/patient/
  dashboard         GET   Stats (prescription count, active consents, etc.)
  vault             GET   Medical records with type/date filters
  prescriptions     GET   Prescriptions with status filter
  history           GET   Encounters
  consents          GET   Active + revoked consents
  access-requests   GET   Pending/past consent requests
  access-request/[id]/approve  POST  Approve + create consent
  access-request/[id]/deny     POST  Deny request
  consent/sign      POST  Store signature proof + activate consent
  consent/revoke    POST  Deactivate consent
  audit             GET   Patient's audit events

/api/hospital/
  patients          GET   Search patients
  prescriptions     GET/POST  List / create (consent-gated)
  consent-requests  GET/POST  List / create
  metrics           GET   Dashboard stats

/api/pharmacy/
  verify            POST  Check prescription + consent validity
  dispense          POST  Create dispensing record
  prescriptions     GET   Active prescriptions for consented patients
  metrics/audit/inventory  GET  Supporting data

/api/insurance/
  claims            GET/POST  List / submit claims
  verification      GET/POST  List / create verification requests
  metrics/audit     GET  Supporting data

/api/admin/
  metrics           GET   Platform-wide statistics
  analytics         GET   Time-series data for charts
  users             GET   All users
  user/[id]/disable POST  Disable account
  audit             GET   All audit events
  monitoring        GET   Blockchain network health
  fraud-alerts      GET   AI fraud flags
  settings          PUT   Update feature flags

/api/ai/
  insights          GET   Generate safety insights via Groq
  fraud-detection   GET   Run fraud detection via Groq
  insights/dismiss  POST  Mark insight as dismissed

/api/blockchain/
  verify            POST  Call SignatureVerifier.sol on-chain
```

---

### Authentication — Supabase Auth

- **Email + password** via `signInWithPassword`
- **Google OAuth** via `signInWithOAuth` (enable Google provider in Supabase dashboard)
- **Sessions** stored in cookies via `@supabase/ssr` (works with Next.js middleware)
- **Middleware** (`src/middleware.ts`) validates every request:
  - Unauthenticated access to protected routes → login redirect
  - Authenticated users on public pages → role-based redirect
  - Falls back to JWT `user_metadata.role` if profile row is missing

---

### Blockchain — Ethereum Sepolia

**`SignatureVerifier.sol`** — on-chain consent proof

```solidity
function verify(
  address signer,
  bytes32 messageHash,
  uint8 v, bytes32 r, bytes32 s
) public returns (address recovered)
```

**Consent signing (EIP-191 personal_sign):**
1. Patient clicks Approve
2. App hashes the consent payload: `{requestorId, patientId, scope[], expiresAt}`
3. MetaMask signs with `eth_sign` / `personal_sign`
4. `{v, r, s}` stored in `consents.signature_proof`
5. On-chain verification recovers the signer address
6. If recovered == patient's registered wallet → consent is cryptographically proven

**Deploy:**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
# Add the deployed address to NEXT_PUBLIC_CONTRACT_ADDRESS
```

---

### AI — Groq (llama-3.3-70b-versatile)

Two AI-powered endpoints, both server-side only (API key never exposed to client):

| Endpoint | Input | Output |
|----------|-------|--------|
| Safety Insights | Current prescriptions + recent records | Drug interactions, adherence alerts, lab follow-ups |
| Fraud Detection | Complete prescription history | Fraud score 0–100, indicator text, explanation |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Server-only — never expose to client

# Blockchain (Sepolia testnet)
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...      # Deployed SignatureVerifier address
NEXT_PUBLIC_CHAIN_ID=11155111

# Hardhat (for deploying contracts)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0x...               # Wallet with Sepolia ETH

# AI
GROQ_API_KEY=gsk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
MED_CHAIN/
├── contracts/              # Solidity smart contracts (Hardhat — do not modify)
├── scripts/                # Hardhat deploy scripts
├── ignition/               # Hardhat Ignition modules
├── test/                   # Contract tests
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # Run first
│   └── seed.sql                      # Demo data (run second)
└── src/
    ├── app/
    │   ├── (dashboard)/              # Authenticated pages (get DashboardLayout)
    │   │   ├── patient/              # 9 pages
    │   │   ├── hospital/             # 5 pages
    │   │   ├── pharmacy/             # 5 pages
    │   │   ├── insurance/            # 4 pages
    │   │   └── admin/                # 7 pages
    │   ├── api/                      # 40+ API route handlers
    │   ├── auth/                     # Login, signup, callback
    │   └── page.tsx                  # Landing page
    ├── components/
    │   ├── layouts/                  # Sidebar, Header, DashboardLayout
    │   ├── common/                   # Shared UI (PageHeader, StatusBadge, etc.)
    │   ├── patient/                  # DashboardCard
    │   ├── consent/                  # ConsentDialog, SignaturePanel
    │   └── blockchain/               # WalletStatus, NetworkStatus, TxStatus
    ├── hooks/                        # useAuth, useRole, useWallet, useSignature, useContract
    ├── lib/                          # supabaseClient, supabaseServer, supabaseAdmin, contracts
    ├── providers/                    # AuthProvider, Web3Provider, ClientProvider
    ├── services/                     # Client-side API wrappers
    ├── types/                        # TypeScript interfaces
    ├── constants/                    # Routes, roles, colors
    └── middleware.ts                 # Session guard + role-based redirect
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 18, TypeScript 5 |
| Styling | Tailwind CSS v3, Radix UI primitives, lucide-react |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Database | Supabase PostgreSQL with Row Level Security |
| Blockchain | Ethereum Sepolia, ethers.js v6, MetaMask |
| AI | Groq SDK, llama-3.3-70b-versatile model |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts (admin analytics dashboard) |
| Smart Contract | Solidity, Hardhat 3, Hardhat Ignition |

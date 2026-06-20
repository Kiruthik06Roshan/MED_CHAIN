export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "patient" | "doctor" | "pharmacy";
  wallet_address: string | null;
  created_at: Date;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "safe" | "warning" | "danger";
  description: string;
}

export interface SafetyCheckResult {
  status: "safe" | "warning" | "danger";
  message: string;
  interactions: DrugInteraction[];
  confidence?: number;
}

export interface HealthRecord {
  id: string;
  patient_id: string;
  record_type: "prescription" | "lab_report" | "allergy" | "note";
  title: string;
  content: string;
  metadata: {
    doctor_name?: string;
    hospital?: string;
    medications?: string[];
  };
  created_at: Date;
}

export interface AccessGrant {
  id: string;
  patient_id: string;
  granted_to: string;
  record_id: string;
  signature: string;
  status: "active" | "revoked" | "expired";
  expires_at: Date | null;
  created_at: Date;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  diagnosis: string;
  ai_safety_check: SafetyCheckResult;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action:
    | "view_record"
    | "grant_access"
    | "revoke_access"
    | "create_prescription"
    | "create_record";
  target_id: string | null;
  ip_address: string | null;
  created_at: Date;
}

export interface RecordItem extends HealthRecord {
  ownerId?: string;
  createdAt?: string;
}

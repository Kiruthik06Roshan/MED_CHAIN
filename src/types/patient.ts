export interface MedicalRecord {
  id: string;
  type: 'prescription' | 'lab' | 'note' | 'encounter' | 'attachment';
  title: string;
  provider: string;
  date: string;
  data: Record<string, unknown>;
  signatureProof?: SignatureProof;
  createdAt: string;
  // File upload fields
  isFile?: boolean;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  storagePath?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  prescriberId: string;
  prescriberName: string;
  medication: string;
  dosage: string;
  quantity: number;
  refills: number;
  dateIssued: string;
  expiryDate: string;
  notes?: string;
  status: 'active' | 'filled' | 'expired' | 'cancelled';
  signatureProof?: SignatureProof;
  createdAt: string;
}

export interface Encounter {
  id: string;
  type: 'visit' | 'test' | 'procedure' | 'consultation';
  provider: string;
  date: string;
  notes?: string;
  diagnoses?: string[];
  procedures?: string[];
}

export interface SignatureProof {
  signer: string;
  messageHash: string;
  signature: string;
  v: number;
  r: string;
  s: string;
  timestamp: string;
  txHash?: string;
}

export interface PatientDashboardStats {
  totalPrescriptions: number;
  activeConsents: number;
  pendingAccessRequests: number;
  auditEventsLast30Days: number;
}

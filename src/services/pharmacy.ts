import type { Prescription } from '@/types/patient';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export interface VerificationResult {
  isValid: boolean;
  prescription?: Prescription;
  consentStatus: 'active' | 'none' | 'expired';
  patientName: string;
  reason?: string;
}

export interface Dispensing {
  id: string;
  prescriptionId: string;
  pharmacyId: string;
  quantityDispensed: number;
  refillsRemaining: number;
  dispensedAt: string;
}

export async function verifyPrescription(prescriptionId: string): Promise<VerificationResult> {
  return fetchAPI('/api/pharmacy/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prescriptionId }),
  });
}

export async function dispenseMedication(prescriptionId: string, quantityDispensed: number, refillsRemaining: number): Promise<void> {
  await fetchAPI('/api/pharmacy/dispense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prescriptionId, quantityDispensed, refillsRemaining }),
  });
}

export async function getPendingPrescriptions(): Promise<Prescription[]> {
  return fetchAPI('/api/pharmacy/prescriptions');
}

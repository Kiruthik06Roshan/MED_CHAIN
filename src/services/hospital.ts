import type { Prescription } from '@/types/patient';
import type { ConsentRequest } from '@/types/consent';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export interface PatientSearchResult {
  id: string;
  fullName: string;
  email: string;
  lastAccess?: string;
  hasConsent: boolean;
}

export async function searchPatients(query: string): Promise<PatientSearchResult[]> {
  return fetchAPI(`/api/hospital/patients?q=${encodeURIComponent(query)}`);
}

export async function getPatientDetail(patientId: string) {
  return fetchAPI(`/api/hospital/patient/${patientId}`);
}

export async function createConsentRequest(patientId: string, purpose: string, scope: string[]): Promise<void> {
  await fetchAPI('/api/hospital/consent-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, purpose, scope }),
  });
}

export async function createPrescription(data: {
  patientId: string;
  medication: string;
  dosage: string;
  quantity: number;
  refills: number;
  expiryDate: string;
  notes?: string;
}): Promise<void> {
  await fetchAPI('/api/hospital/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getHospitalPrescriptions(): Promise<Prescription[]> {
  return fetchAPI('/api/hospital/prescriptions');
}

export async function getConsentRequests(): Promise<ConsentRequest[]> {
  return fetchAPI('/api/hospital/consent-requests');
}

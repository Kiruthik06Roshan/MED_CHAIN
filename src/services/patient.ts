import type { PatientDashboardStats, MedicalRecord, Prescription, Encounter } from '@/types/patient';
import type { ConsentGrant, ConsentRequest } from '@/types/consent';
import type { AuditEvent } from '@/types';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  return res.json();
}

export async function getPatientDashboard(): Promise<PatientDashboardStats> {
  return fetchAPI('/api/patient/dashboard');
}

export async function getVaultRecords(filters?: { type?: string; dateFrom?: string; dateTo?: string }): Promise<MedicalRecord[]> {
  const params = new URLSearchParams(filters as Record<string, string>);
  return fetchAPI(`/api/patient/vault?${params}`);
}

export async function getPrescriptions(): Promise<Prescription[]> {
  return fetchAPI('/api/patient/prescriptions');
}

export async function getMedicalHistory(): Promise<Encounter[]> {
  return fetchAPI('/api/patient/history');
}

export async function getConsents(): Promise<ConsentGrant[]> {
  return fetchAPI('/api/patient/consents');
}

export async function getAccessRequests(): Promise<ConsentRequest[]> {
  return fetchAPI('/api/patient/access-requests');
}

export async function getAuditLog(filters?: { dateFrom?: string; dateTo?: string; action?: string }): Promise<AuditEvent[]> {
  const params = new URLSearchParams(filters as Record<string, string>);
  return fetchAPI(`/api/patient/audit?${params}`);
}

export async function revokeConsent(consentId: string): Promise<void> {
  await fetchAPI('/api/patient/consent/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consentId }),
  });
}

export async function approveAccessRequest(requestId: string): Promise<void> {
  await fetchAPI(`/api/patient/access-request/${requestId}/approve`, { method: 'POST' });
}

export async function denyAccessRequest(requestId: string): Promise<void> {
  await fetchAPI(`/api/patient/access-request/${requestId}/deny`, { method: 'POST' });
}

export async function uploadDocument(formData: FormData): Promise<{ record: { id: string; title: string; fileName: string } }> {
  const res = await fetch('/api/documents/upload', { method: 'POST', body: formData, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error((err as { error?: string }).error ?? 'Upload failed');
  }
  return res.json();
}

export async function getDocumentUrl(documentId: string): Promise<{ signedUrl: string; fileType: string; fileName: string }> {
  return fetchAPI(`/api/documents/${documentId}`);
}


async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export interface Claim {
  id: string;
  patientId: string;
  claimAmount: number;
  status: 'submitted' | 'verified' | 'approved' | 'denied';
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  claimId: string;
  patientId: string;
  requestedDataScope: string[];
  approvedDataScope: string[];
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
}

export async function getClaims(): Promise<Claim[]> {
  return fetchAPI('/api/insurance/claims');
}

export async function createVerificationRequest(patientId: string, claimId: string, dataScope: string[]): Promise<void> {
  await fetchAPI('/api/insurance/verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, claimId, dataScope }),
  });
}

export async function getVerificationRequests(): Promise<VerificationRequest[]> {
  return fetchAPI('/api/insurance/verification');
}

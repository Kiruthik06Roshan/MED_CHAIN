import type { SafetyInsight, FraudAlert } from '@/types/ai';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export async function getPatientSafetyInsights(): Promise<SafetyInsight[]> {
  return fetchAPI('/api/ai/insights');
}

export async function getFraudAlerts(): Promise<FraudAlert[]> {
  return fetchAPI('/api/ai/fraud-detection');
}

export async function dismissInsight(insightId: string): Promise<void> {
  await fetchAPI('/api/ai/insights/dismiss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ insightId }),
  });
}

export async function triageFraudAlert(alertId: string): Promise<void> {
  await fetchAPI('/api/ai/fraud-detection/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId }),
  });
}

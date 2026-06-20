async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export interface DashboardMetrics {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalRecords: number;
  activePrescriptions: number;
  accessVolume: number;
  fraudAlertsToday: number;
  activeConsents: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  isDisabled: boolean;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return fetchAPI('/api/admin/metrics');
}

export async function getUsers(): Promise<AdminUser[]> {
  return fetchAPI('/api/admin/users');
}

export async function disableUser(userId: string): Promise<void> {
  await fetchAPI(`/api/admin/user/${userId}/disable`, { method: 'POST' });
}

export async function getAdminAuditLog(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/api/admin/audit?${params}`);
}

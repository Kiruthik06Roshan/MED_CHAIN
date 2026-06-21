import type { UserRole } from '@/constants/roles';

export type { UserRole };

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  walletAddress?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  phone?: string;
  organizationName?: string;
}

export type StatusType = 'active' | 'inactive' | 'pending' | 'expired' | 'revoked';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type DataScope = 'medications' | 'labs' | 'encounters' | 'notes' | 'attachments' | 'all';

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  scope: DataScope[];
  result: 'success' | 'failure' | 'denied';
  timestamp: string;
  txHash?: string;
  ipAddress?: string;
}

import type { UserRole } from '@/constants/roles';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  walletAddress?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  organizationName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  walletAddress?: string;
  organizationName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

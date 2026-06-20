'use client';

import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/constants/roles';

export function useRole() {
  const { user } = useAuth();

  return {
    role: user?.role ?? null,
    isPatient: user?.role === 'PATIENT',
    isHospital: user?.role === 'HOSPITAL',
    isPharmacy: user?.role === 'PHARMACY',
    isInsurance: user?.role === 'INSURANCE',
    isAdmin: user?.role === 'ADMIN',
    hasRole: (r: UserRole) => user?.role === r,
  };
}

import type { UserRole } from '@/constants/roles';
import { ROLE_HOME_ROUTES } from '@/constants/routes';

export function getRoleHomeRoute(role: UserRole): string {
  return ROLE_HOME_ROUTES[role] ?? '/';
}

export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isValidRole(role: string): role is UserRole {
  return ['PATIENT', 'HOSPITAL', 'PHARMACY', 'INSURANCE', 'ADMIN'].includes(role);
}

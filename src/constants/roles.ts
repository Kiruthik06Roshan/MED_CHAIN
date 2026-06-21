export const ROLES = {
  PATIENT: 'PATIENT',
  HOSPITAL: 'HOSPITAL',
  PHARMACY: 'PHARMACY',
  INSURANCE: 'INSURANCE',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  PATIENT: 'Patient',
  HOSPITAL: 'Hospital / Clinic',
  PHARMACY: 'Pharmacy',
  INSURANCE: 'Insurance Provider',
  ADMIN: 'Administrator',
};

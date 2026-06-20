export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    CALLBACK: '/auth/callback',
  },
  PATIENT: {
    ROOT: '/patient',
    VAULT: '/patient/vault',
    PRESCRIPTIONS: '/patient/prescriptions',
    HISTORY: '/patient/history',
    CONSENT: '/patient/consent',
    ACCESS_REQUESTS: '/patient/access-requests',
    AUDIT: '/patient/audit',
    INSIGHTS: '/patient/insights',
    PROFILE: '/patient/profile',
  },
  HOSPITAL: {
    ROOT: '/hospital',
    PATIENTS: '/hospital/patients',
    PRESCRIPTIONS: '/hospital/prescriptions',
    PRESCRIPTIONS_NEW: '/hospital/prescriptions/new',
    CONSENT_REQUESTS: '/hospital/consent-requests',
    VERIFICATION: '/hospital/verification',
  },
  PHARMACY: {
    ROOT: '/pharmacy',
    VERIFY: '/pharmacy/verify',
    DISPENSE: '/pharmacy/dispense',
    INVENTORY: '/pharmacy/inventory',
    AUDIT: '/pharmacy/audit',
  },
  INSURANCE: {
    ROOT: '/insurance',
    CLAIMS: '/insurance/claims',
    VERIFICATION: '/insurance/verification',
    AUDIT: '/insurance/audit',
  },
  ADMIN: {
    ROOT: '/admin',
    ANALYTICS: '/admin/analytics',
    MONITORING: '/admin/monitoring',
    FRAUD: '/admin/fraud-detection',
    USERS: '/admin/users',
    AUDIT: '/admin/audit',
    SETTINGS: '/admin/settings',
  },
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.SIGNUP,
  ROUTES.AUTH.CALLBACK,
];

export const ROLE_HOME_ROUTES: Record<string, string> = {
  PATIENT: ROUTES.PATIENT.ROOT,
  HOSPITAL: ROUTES.HOSPITAL.ROOT,
  PHARMACY: ROUTES.PHARMACY.ROOT,
  INSURANCE: ROUTES.INSURANCE.ROOT,
  ADMIN: ROUTES.ADMIN.ROOT,
};

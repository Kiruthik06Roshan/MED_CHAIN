import type { ConsentRequest } from '@/types/consent';

export function createConsentPayload(request: ConsentRequest) {
  return {
    version: '1.0',
    requestId: request.id,
    grantee: request.requestorId,
    purpose: request.purpose,
    scope: request.scope,
    expiresAt: request.expiryDate,
    issuedAt: new Date().toISOString(),
  };
}

export function hasConsentExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function formatConsentScope(scope: string[]): string {
  return scope.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
}

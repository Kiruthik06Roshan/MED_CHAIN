import type { DataScope } from '@/types';

export interface ConsentRequest {
  id: string;
  requestorId: string;
  requestorName: string;
  requestorRole: 'HOSPITAL' | 'PHARMACY' | 'INSURANCE';
  purpose: string;
  scope: DataScope[];
  dataCategories: string[];
  expiryDate: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
}

export interface ConsentGrant {
  id: string;
  granteeId: string;
  granteeName: string;
  grantorId: string;
  purpose: string;
  scope: DataScope[];
  signedPayload: Record<string, unknown>;
  blockchainTxHash?: string;
  signatureProof?: ConsentSignature;
  isActive: boolean;
  expiresAt: string;
  grantedAt: string;
  revokedAt?: string;
}

export interface ConsentSignature {
  signer: string;
  messageHash: string;
  signature: string;
  v: number;
  r: string;
  s: string;
  timestamp: string;
}

"use client";

import { useState } from "react";
import { ethers } from "ethers";

type GrantResponse = {
  success: boolean;
  signature: string;
  expiresAt: string;
};

export function useAccessGrant() {
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  async function grantAccess(recordId: string, doctorAddress: string) {
    setIsGranting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("Wallet not found");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const patientAddress = await signer.getAddress();
      const message = `Grant access to ${recordId} for ${doctorAddress} at ${Date.now()}`;
      const signedMessage = await signer.signMessage(message);

      setSignature(signedMessage);

      const response = await fetch("/api/access/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          doctorId: doctorAddress,
          patientAddress,
          signature: signedMessage,
          message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Grant failed");
      }

      return (await response.json()) as GrantResponse;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Grant failed";
      setError(message);
      throw caught;
    } finally {
      setIsGranting(false);
    }
  }

  async function revokeAccess(grantId: string) {
    setIsGranting(true);
    setError(null);

    try {
      const response = await fetch("/api/access/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Revoke failed");
      }

      return (await response.json()) as { success: boolean; revokedAt: string };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Revoke failed";
      setError(message);
      throw caught;
    } finally {
      setIsGranting(false);
    }
  }

  return { grantAccess, revokeAccess, isGranting, error, signature };
}

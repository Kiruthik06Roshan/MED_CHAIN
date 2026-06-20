import { useState } from "react";
import { verifySignature } from "@/lib/contract";

export function useSignatureVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verifyOnChain(signature: string, message: string, signerAddress: string) {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifySignature(signature, message, signerAddress);
      setIsValid(Boolean(result.valid));
      setTxHash(result.txHash ?? null);
      return result;
    } catch (caught) {
      const messageValue = caught instanceof Error ? caught.message : "Verification failed";
      setError(messageValue);
      setIsValid(false);
      return { valid: false as const };
    } finally {
      setIsVerifying(false);
    }
  }

  return { verifyOnChain, isVerifying, txHash, isValid, error };
}

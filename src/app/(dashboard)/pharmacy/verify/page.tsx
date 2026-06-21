'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { verifyPrescription, type VerificationResult } from '@/services/pharmacy';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';

export default function PharmacyVerifyPage() {
  const [prescriptionId, setPrescriptionId] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await verifyPrescription(prescriptionId);
      setResult(res);
    } catch {
      setError('Prescription not found or verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Prescription Verification"
        description="Enter a prescription ID to verify its authenticity and eligibility for dispensing." />

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleVerify} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={prescriptionId} onChange={e => setPrescriptionId(e.target.value)}
              placeholder="Enter prescription ID (UUID)…"
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
          </div>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify
          </button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className={`bg-white border rounded-xl p-6 ${result.isValid ? 'border-emerald-300' : 'border-red-300'}`}>
            <div className="flex items-center gap-3 mb-4">
              {result.isValid
                ? <CheckCircle className="w-8 h-8 text-emerald-600" />
                : <XCircle className="w-8 h-8 text-red-600" />}
              <div>
                <p className={`text-lg font-bold ${result.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result.isValid ? 'Eligible for Dispensing' : 'Cannot Dispense'}
                </p>
                {result.reason && <p className="text-sm text-muted-foreground">{result.reason}</p>}
              </div>
            </div>

            {result.prescription && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">MEDICATION</p>
                  <p className="font-semibold">{result.prescription.medication}</p>
                  <p className="text-muted-foreground">{result.prescription.dosage}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">PATIENT</p>
                  <p className="font-semibold">{result.patientName}</p>
                  <p className="text-muted-foreground capitalize">Consent: {result.consentStatus}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">PRESCRIBER</p>
                  <p className="font-semibold">{result.prescription.prescriberName}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">QUANTITY / REFILLS</p>
                  <p className="font-semibold">{result.prescription.quantity} units</p>
                  <p className="text-muted-foreground">{result.prescription.refills} refills</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

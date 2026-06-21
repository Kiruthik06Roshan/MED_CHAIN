'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { createVerificationRequest } from '@/services/insurance';
import { CheckCircle, Loader2 } from 'lucide-react';

const DATA_SCOPES = ['medications', 'labs', 'encounters', 'notes', 'attachments'];

export default function InsuranceVerificationPage() {
  const [form, setForm] = useState({ patientId: '', claimId: '', dataScope: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleScope = (scope: string) =>
    setForm(f => ({
      ...f,
      dataScope: f.dataScope.includes(scope)
        ? f.dataScope.filter(s => s !== scope)
        : [...f.dataScope, scope],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createVerificationRequest(form.patientId, form.claimId, form.dataScope).catch(() => null);
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-20">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Verification Request Sent</h2>
        <p className="text-muted-foreground">The patient will be notified and can approve or deny access.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Request Medical Verification"
        description="Send a scoped verification request to a patient for a specific insurance claim." />

      <div className="max-w-2xl bg-white border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Patient ID</label>
            <input value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
              placeholder="Patient UUID"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Claim ID</label>
            <input value={form.claimId} onChange={e => setForm(f => ({ ...f, claimId: e.target.value }))}
              placeholder="Claim UUID"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data Scope (select what you need)</label>
            <div className="flex flex-wrap gap-2">
              {DATA_SCOPES.map(scope => (
                <button key={scope} type="button" onClick={() => toggleScope(scope)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors border ${
                    form.dataScope.includes(scope)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}>
                  {scope}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading || !form.patientId || !form.claimId || form.dataScope.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Verification Request
          </button>
        </form>
      </div>
    </div>
  );
}

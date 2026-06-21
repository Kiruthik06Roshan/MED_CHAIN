'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { createPrescription } from '@/services/hospital';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { Loader2, FileText } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  medication: z.string().min(1, 'Medication is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  quantity: z.coerce.number().positive(),
  refills: z.coerce.number().min(0),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createPrescription(data);
    setSuccess(true);
    setTimeout(() => router.push(ROUTES.HOSPITAL.PRESCRIPTIONS), 1500);
  };

  return (
    <div>
      <PageHeader title="Create Prescription" description="Issue a new prescription for a patient." />

      {success ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold">Prescription created!</p>
          <p className="text-muted-foreground text-sm">Redirecting…</p>
        </div>
      ) : (
        <div className="max-w-2xl bg-white border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient ID</label>
              <input {...register('patientId')} placeholder="UUID of patient"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.patientId && <p className="text-xs text-destructive mt-1">{errors.patientId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Medication</label>
                <input {...register('medication')} placeholder="e.g. Amoxicillin"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.medication && <p className="text-xs text-destructive mt-1">{errors.medication.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dosage</label>
                <input {...register('dosage')} placeholder="e.g. 500mg twice daily"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.dosage && <p className="text-xs text-destructive mt-1">{errors.dosage.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input {...register('quantity')} type="number" defaultValue={30}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Refills</label>
                <input {...register('refills')} type="number" defaultValue={0}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input {...register('expiryDate')} type="date"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.expiryDate && <p className="text-xs text-destructive mt-1">{errors.expiryDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea {...register('notes')} rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Prescription
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

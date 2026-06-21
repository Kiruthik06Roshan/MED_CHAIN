'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Wallet, User, Save } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  organizationName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { address, isConnected } = useWallet();
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      organizationName: user?.organizationName ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;
    await supabase.from('user_profiles').update({
      full_name: data.fullName,
      phone: data.phone,
      organization_name: data.organizationName,
      wallet_address: address ?? undefined,
    }).eq('id', user.id);
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account information and wallet." />

      <div className="max-w-2xl space-y-6">
        {/* Profile form */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role?.toLowerCase()} · {user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input {...register('fullName')} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...register('phone')} placeholder="+1 555 000 0000" className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {['HOSPITAL', 'PHARMACY', 'INSURANCE'].includes(user?.role ?? '') && (
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input {...register('organizationName')} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}

            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Wallet */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Wallet Connection
          </h3>
          {isConnected && address ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-emerald-700">Connected</p>
                <p className="text-xs text-emerald-600 font-mono">{address}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Connect your Ethereum wallet for signature-based consent verification.</p>
              <ConnectWalletButton variant="primary" size="default" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { createServerSupabaseClient } from '@/lib/supabaseServer';
import type { UserRole } from '@/constants/roles';
import type { DataScope } from '@/types';

export async function logAccess(params: {
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  scope: DataScope[];
  result: 'success' | 'failure' | 'denied';
  txHash?: string;
  ipAddress?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      actor_role: params.actorRole,
      action: params.action,
      target_id: params.targetId,
      scope: params.scope,
      result: params.result,
      tx_hash: params.txHash,
      ip_address: params.ipAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[audit] logAccess error:', err);
  }
}

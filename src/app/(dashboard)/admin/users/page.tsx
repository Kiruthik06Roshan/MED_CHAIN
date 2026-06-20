'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getUsers, disableUser, type AdminUser } from '@/services/admin';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { ROLE_LABELS } from '@/constants/roles';
import type { UserRole } from '@/constants/roles';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { getUsers().then(setUsers).finally(() => setLoading(false)); }, []);

  const handleDisable = async (userId: string) => {
    if (!confirm('Disable this user account?')) return;
    setActing(userId);
    await disableUser(userId).catch(() => null);
    setUsers(u => u.map(x => x.id === userId ? { ...x, isDisabled: true } : x));
    setActing(null);
  };

  return (
    <div>
      <PageHeader title="User Management" description="Manage all user accounts across all roles." />
      {loading ? <LoadingSpinner className="py-12" /> :
        users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(user => (
                  <tr key={user.id} className={`hover:bg-secondary/20 transition-colors ${user.isDisabled ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-secondary px-2 py-0.5 rounded text-xs">{ROLE_LABELS[user.role as UserRole] ?? user.role}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${user.isDisabled ? 'text-destructive' : 'text-emerald-600'}`}>
                        {user.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!user.isDisabled && (
                        <button onClick={() => handleDisable(user.id)} disabled={acting === user.id}
                          className="text-xs text-destructive hover:underline disabled:opacity-50">
                          Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

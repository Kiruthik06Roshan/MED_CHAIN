'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/utils/cn';
import { formatAddress } from '@/utils/blockchain';
import { LogOut, User, Wallet, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Props {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: Props) {
  const { user, signOut } = useAuth();
  const { address, isConnected, connectWallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-border z-[var(--z-header)] flex items-center justify-between px-6 shadow-sm transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Left — breadcrumb area (empty for now) */}
      <div />

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Wallet badge */}
        {isConnected && address ? (
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200">
            <Wallet className="w-3 h-3" />
            {formatAddress(address)}
          </div>
        ) : (
          <button onClick={connectWallet}
            className="hidden sm:flex items-center gap-1.5 bg-secondary text-muted-foreground px-3 py-1 rounded-full text-xs font-medium hover:bg-secondary/80 transition-colors border border-border">
            <Wallet className="w-3 h-3" />
            Connect Wallet
          </button>
        )}

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 hover:bg-secondary rounded-lg px-3 py-2 transition-colors">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">{user?.fullName ?? 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-card-hover border border-border py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

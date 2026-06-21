'use client';

import { createContext, useContext } from 'react';
import type { BrowserProvider, Signer } from 'ethers';

interface Web3ContextValue {
  provider: BrowserProvider | null;
  signer: Signer | null;
  chainId: number | null;
}

const Web3Context = createContext<Web3ContextValue>({ provider: null, signer: null, chainId: null });

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Provider/signer are obtained lazily through useWallet hook
  return (
    <Web3Context.Provider value={{ provider: null, signer: null, chainId: null }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3Context() {
  return useContext(Web3Context);
}

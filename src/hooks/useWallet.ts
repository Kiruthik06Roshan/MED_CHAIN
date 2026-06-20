'use client';

import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  chainId: number | null;
}

const hasEthereum = () =>
  typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
  });

  const getProvider = useCallback(() => {
    if (!hasEthereum()) return null;
    return new BrowserProvider(window.ethereum as Parameters<typeof BrowserProvider>[0]);
  }, []);

  const connectWallet = useCallback(async () => {
    if (!hasEthereum()) {
      setState(s => ({ ...s, error: 'MetaMask not detected. Please install MetaMask.' }));
      return null;
    }
    setState(s => ({ ...s, isConnecting: true, error: null }));
    try {
      const provider = getProvider()!;
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      setState({ address, isConnected: true, isConnecting: false, error: null, chainId: Number(network.chainId) });
      return address;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setState(s => ({ ...s, isConnecting: false, error: msg }));
      return null;
    }
  }, [getProvider]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!hasEthereum() || !state.address) return null;
    try {
      const provider = getProvider()!;
      const signer = await provider.getSigner();
      return await signer.signMessage(message);
    } catch {
      return null;
    }
  }, [getProvider, state.address]);

  const getWalletAddress = useCallback(() => state.address, [state.address]);
  const isWalletConnected = useCallback(() => state.isConnected, [state.isConnected]);

  // Auto-detect if already connected — runs only in the browser
  useEffect(() => {
    if (!hasEthereum()) return;
    window.ethereum!.request({ method: 'eth_accounts' }).then((accounts) => {
      const list = accounts as string[];
      if (list.length > 0) {
        getProvider()?.getNetwork().then(network => {
          setState({ address: list[0], isConnected: true, isConnecting: false, error: null, chainId: Number(network.chainId) });
        });
      }
    });
  }, [getProvider]);

  return {
    ...state,
    connectWallet,
    signMessage,
    getWalletAddress,
    isWalletConnected,
    // getProvider() is NOT called here during render — consumers call it themselves when needed
    getProvider,
  };
}

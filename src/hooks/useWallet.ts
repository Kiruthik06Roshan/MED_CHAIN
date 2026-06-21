'use client';

import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, type JsonRpcSigner, type Eip1193Provider } from 'ethers';
import { createClient } from '@/lib/supabaseClient';

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

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_HEX = '0xaa36a7';

const hasEthereum = () =>
  typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

async function switchToSepolia() {
  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_HEX }],
    });
  } catch (switchErr: unknown) {
    const err = switchErr as { code?: number };
    // 4902 = chain not added to MetaMask yet
    if (err.code === 4902) {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_HEX,
            chainName: 'Sepolia Test Network',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [
              process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? 'https://rpc.sepolia.org',
            ],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
    } else {
      throw switchErr;
    }
  }
}

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
    return new BrowserProvider(window.ethereum as Eip1193Provider);
  }, []);

  /** Get a JsonRpcSigner from the current provider */
  const getSigner = useCallback(async (): Promise<JsonRpcSigner | null> => {
    const provider = getProvider();
    if (!provider) return null;
    return provider.getSigner();
  }, [getProvider]);

  /** Connect wallet, switch to Sepolia, and persist address in Supabase */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!hasEthereum()) {
      setState(s => ({
        ...s,
        error: 'MetaMask not detected. Please install MetaMask.',
      }));
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    setState(s => ({ ...s, isConnecting: true, error: null }));

    try {
      const provider = getProvider()!;
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      let chainId = Number(network.chainId);

      // Auto-switch to Sepolia if on the wrong network
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
        chainId = SEPOLIA_CHAIN_ID;
      }

      // Persist wallet address to Supabase user_profiles
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_profiles')
            .update({ wallet_address: address })
            .eq('id', user.id);
        }
      } catch {
        // Non-fatal — wallet still connects even if Supabase update fails
        console.warn('[useWallet] Could not save wallet address to profile');
      }

      setState({
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
        chainId,
      });
      return address;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setState(s => ({ ...s, isConnecting: false, error: msg }));
      return null;
    }
  }, [getProvider]);

  /** Disconnect (client-side only — MetaMask doesn't support programmatic revoke) */
  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
    });
  }, []);

  /** Sign an arbitrary message with the connected wallet */
  const signMessage = useCallback(
    async (message: string | Uint8Array): Promise<string | null> => {
      if (!hasEthereum() || !state.address) return null;
      try {
        const provider = getProvider()!;
        const signer = await provider.getSigner();
        return await signer.signMessage(message);
      } catch {
        return null;
      }
    },
    [getProvider, state.address]
  );

  const getWalletAddress = useCallback(() => state.address, [state.address]);
  const isWalletConnected = useCallback(() => state.isConnected, [state.isConnected]);

  // Auto-detect existing MetaMask connection on mount
  useEffect(() => {
    if (!hasEthereum()) return;
    window.ethereum!.request({ method: 'eth_accounts' }).then(accounts => {
      const list = accounts as string[];
      if (list.length > 0) {
        getProvider()
          ?.getNetwork()
          .then(network => {
            setState({
              address: list[0],
              isConnected: true,
              isConnecting: false,
              error: null,
              chainId: Number(network.chainId),
            });
          });
      }
    });
  }, [getProvider]);

  return {
    ...state,
    // Primary API (used throughout the project)
    connectWallet,
    signMessage,
    getWalletAddress,
    isWalletConnected,
    getProvider,
    getSigner,
    disconnect,
    // Convenience alias used by the MetaMask integration pattern
    connect: connectWallet,
  };
}

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createConnectedSession, type ConnectedSession } from '../lib/midnight';

type WalletType = '1am' | 'lace' | 'nightly' | 'midnight wallet' | null;
type WalletStatus = 'checking' | 'detected' | 'not-found';
export type MidnightNetwork = 'preview' | 'preprod';

type InjectedWallet = {
  api: any;
  type: Exclude<WalletType, null>;
  name: string;
};

type WalletContextValue = {
  address: string | null;
  isConnected: boolean;
  walletType: WalletType;
  isConnecting: boolean;
  walletStatus: WalletStatus;
  session: ConnectedSession | null;
  error: string | null;
  connect: (network?: MidnightNetwork) => Promise<ConnectedSession | undefined>;
  disconnect: () => void;
  clearError: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function findWallet(): InjectedWallet | null {
  const injected = Object.values((window as any).midnight ?? {}) as any[];
  const candidate = injected.find((entry) => typeof entry?.connect === 'function' || typeof entry?.enable === 'function');
  if (!candidate) return null;
  const identity = `${candidate.name ?? ''} ${candidate.rdns ?? ''}`.toLowerCase();
  const type: InjectedWallet['type'] = identity.includes('lace') ? 'lace' : identity.includes('1am') ? '1am' : identity.includes('nightly') ? 'nightly' : 'midnight wallet';
  return { api: candidate, type, name: candidate.name ?? 'Midnight wallet' };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('checking');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();
    const poll = window.setInterval(() => {
      const wallet = findWallet();
      if (wallet) {
        setWalletType(wallet.type);
        setWalletStatus('detected');
        window.clearInterval(poll);
      } else if (Date.now() - startedAt > 7000) {
        setWalletStatus('not-found');
        window.clearInterval(poll);
      }
    }, 250);
    return () => window.clearInterval(poll);
  }, []);

  const connect = useCallback(async (network: MidnightNetwork = 'preprod') => {
    if (connectingRef.current) return undefined;
    connectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      const wallet = findWallet();
      if (!wallet) throw new Error('No Midnight wallet detected. Install Lace or 1AM, then refresh this page.');
      
      const connectFn = wallet.api.connect ?? wallet.api.enable;
      if (typeof connectFn !== 'function') throw new Error('Wallet found, but no connect or enable method is available.');
      
      const api = await connectFn.call(wallet.api, network);
      const connected = await createConnectedSession(api);
      setSession(connected);
      setAddress(connected.unshieldedAddress);
      setWalletType(wallet.type);
      setWalletStatus('detected');
      return connected;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      console.error('[WalletContext] Connection error:', reason);
      setError(message);
      return undefined;
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    void session?.api?.disconnect?.();
    setAddress(null);
    setSession(null);
    setError(null);
  }, [session]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: Boolean(session && address),
        walletType,
        isConnecting,
        walletStatus,
        session,
        error,
        connect,
        disconnect,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used inside WalletProvider');
  return context;
}

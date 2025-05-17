'use client';

import { FC, ReactNode, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import NotificationProvider from '@/app/(core)/providers/NotificationProvider';
import { useAuth } from '@/app/(core)/hooks/auth.hooks';

export interface RootProviderProps {
  children: ReactNode | ReactNode[];
}

const RootProvider: FC<RootProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const { fetchAuthenticatedUser } = useAuth();

  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  const wallets = useMemo(() => [new SolflareWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default RootProvider;

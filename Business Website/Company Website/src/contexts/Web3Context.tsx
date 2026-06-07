import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import solanaBlockchainIntegration from '@/services/solanaBlockchainIntegration';

interface Web3ContextType {
  isConnected: boolean;
  walletAddress: string | null;
  ethBalance: string; // Keeping name for compatibility, but returns SOL balance
  ccBalance: number;
  governmentBalance: number;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  purchaseCredits: (ccAmount: number, paymentETH: number, companyId: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const { publicKey, connected, wallet, disconnect: walletDisconnect, select } = useWallet();
  const { connection } = useConnection();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [ccBalance, setCcBalance] = useState(0);
  const [governmentBalance, setGovernmentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync wallet state
  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toString());
      refreshBalances();
    } else {
      setWalletAddress(null);
      setEthBalance('0');
    }
  }, [connected, publicKey, connection]);

  const connectWallet = async () => {
    try {
      if (!wallet) {
        // Find Phantom
        select('Phantom' as any);
      }
      // The wallet adapter handles connection via UI usually, 
      // but if we call this manually, we expect the user to interact with the wallet modal
      // or we can rely on the autoConnect from the provider.
      // Since we are wrapping with WalletModalProvider in SolanaWalletProvider,
      // the connect button in UI triggers the modal.
      // This method is kept for compatibility if called programmatically.
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refreshBalances = async () => {
    if (!publicKey) return;

    try {
      setIsLoading(true);
      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      setEthBalance((balance / LAMPORTS_PER_SOL).toString());

      // Get Government Balance
      const govBal = await solanaBlockchainIntegration.getGovernmentBalance();
      setGovernmentBalance(govBal);

      // Mock CC Balance for now (or implement token query)
      setCcBalance(0);
    } catch (err: any) {
      console.error('Failed to refresh balances:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseCredits = async (ccAmount: number, paymentETH: number, companyId: string): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    setIsLoading(true);
    setError(null);

    try {
      // Use solana service to process payment
      const txHash = await solanaBlockchainIntegration.processPayment(ccAmount, companyId);

      // Refresh balances after successful purchase
      setTimeout(() => {
        refreshBalances();
      }, 5000); // Wait 5 seconds for blockchain confirmation

      return txHash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    walletDisconnect();
    setWalletAddress(null);
    setEthBalance('0');
    setCcBalance(0);
    setGovernmentBalance(0);
    setError(null);
  };

  const value: Web3ContextType = {
    isConnected: connected,
    walletAddress: publicKey ? publicKey.toString() : null,
    ethBalance,
    ccBalance,
    governmentBalance,
    isLoading,
    error,
    connectWallet,
    purchaseCredits,
    refreshBalances,
    disconnect,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
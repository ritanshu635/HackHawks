import React from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { CheckCircle2, ExternalLink, X } from 'lucide-react';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string;
  ccAmount: number;
  ethAmount: number;
}

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  isOpen,
  onClose,
  transactionHash,
  ccAmount,
  ethAmount
}) => {
  if (!isOpen) return null;

  const explorerUrl = `https://sepolia.etherscan.io/tx/${transactionHash}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 text-center shadow-2xl border-green-500/50">
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-green-500">Payment Successful!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your carbon credits have been purchased and transferred to your wallet
        </p>

        <div className="space-y-3 mb-6">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Carbon Credits</span>
              <span className="font-bold">{ccAmount} CC</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Payment Amount</span>
              <span className="font-bold">{ethAmount} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Network</span>
              <span className="font-bold">Sepolia Testnet</span>
            </div>
          </div>
          
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
            <div className="text-xs text-muted-foreground mb-1">Transaction Hash:</div>
            <div className="font-mono text-xs break-all text-blue-500">
              {transactionHash}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => window.open(explorerUrl, '_blank')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold h-12"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Etherscan
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Building2,
  Leaf,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRightCircle,
  ShieldAlert,
  TrendingUp,
  QrCode,
  CreditCard,
  Send,
  FileBadge,
  ArrowLeftRight,
  ExternalLink
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/StatCard';
import { TransactionList } from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CC_PRICE } from '@/types/carbon';
import { api } from '@/services/api';
import { CertificateView } from '@/components/CertificateView';
import { useWeb3 } from '@/contexts/Web3Context';

import { TransactionSuccessModal } from '@/components/TransactionSuccessModal';

export const CompanyDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<CompanyDashboardMain view="dashboard" />} />
      <Route path="credits" element={<CompanyDashboardMain view="credits" />} />
      <Route path="compliance" element={<CompanyDashboardMain view="compliance" />} />
      <Route path="transactions" element={<CompanyDashboardMain view="transactions" />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

interface CompanyDashboardProps {
  view: 'dashboard' | 'credits' | 'compliance' | 'transactions';
}

const CompanyDashboardMain = ({ view }: CompanyDashboardProps) => {
  const { companies, transactions, currentUserId, fetchInitialData, buyCC } = useCarbonStore();
  const {
    isConnected,
    walletAddress,
    ethBalance,
    ccBalance,
    governmentBalance,
    isLoading: web3Loading,
    error: web3Error,
    connectWallet,
    purchaseCredits,
    refreshBalances
  } = useWeb3();

  const [showQRModal, setShowQRModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSolanaWalletModal, setShowSolanaWalletModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionData, setTransactionData] = useState<{
    hash: string;
    ccAmount: number;
    ethAmount: number;
  } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Dynamic user lookup
  const company = (companies || []).find(c => c.id === currentUserId) || (companies && companies[0]) || null;

  if (!company) return <div className="p-20 text-center text-muted-foreground animate-pulse">Establishing Secure Connection...</div>;

  const handleRequestCC = async () => {
    if (!requestAmount || isNaN(Number(requestAmount))) return alert("Enter valid amount");
    try {
      setIsRequesting(true);
      await api.post(`/companies/${company.id}/request-cc`, { amount: Number(requestAmount) });
      await fetchInitialData();
      alert("Request successfully transmitted to Government.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const handlePaymentConfirm = async () => {
    const amountToPay = (company.allocatedCC || 0) * CC_PRICE;
    try {
      await buyCC(company.id, amountToPay, company.allocatedCC);
      setShowQRModal(false);
      alert("Payment Verified! QR Transaction Processed.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSolanaWalletPayment = async () => {
    if (!company.allocatedCC) return;

    try {
      // Convert INR to SOL (simplified conversion - in production, use real exchange rates)
      const amountInINR = company.allocatedCC * CC_PRICE;
      const ethAmount = 0.001; // Simplified: 0.001 SOL per transaction for demo

      const txHash = await purchaseCredits(company.allocatedCC, ethAmount, company.id);

      // Update backend with successful payment
      await buyCC(company.id, amountInINR, company.allocatedCC);

      // Synchronize balance with Green Ledger India via localStorage
      try {
        // Trigger cross-platform sync event for PURCHASE (deducts from government balance)
        (window as any).localStorage.setItem('carbon_purchase_sync_event', JSON.stringify({
          type: 'balance_update',
          ccAmount: company.allocatedCC,
          source: 'carbon-bloom-connect',
          transactionHash: txHash,
          companyId: company.id,
          timestamp: new Date().toISOString(),
          operation: 'purchase'
        }));

        // Remove after a short delay to allow other tabs to process
        setTimeout(() => {
          (window as any).localStorage.removeItem('carbon_purchase_sync_event');
        }, 1000);

        console.log('✅ Purchase sync event triggered for Green Ledger India');
      } catch (syncError) {
        console.warn('⚠️ Failed to trigger sync event:', syncError);
      }

      // Also try API sync (optional)
      try {
        await api.post('/sync/government-balance', {
          ccAmount: company.allocatedCC,
          transactionHash: txHash,
          companyId: company.id,
          platform: 'carbon-bloom-connect'
        });
        console.log('✅ API sync completed');
      } catch (syncError) {
        console.warn('⚠️ API sync failed:', syncError);
      }

      setShowSolanaWalletModal(false);

      // Show success modal with transaction details
      setTransactionData({
        hash: txHash,
        ccAmount: company.allocatedCC,
        ethAmount: ethAmount
      });
      setShowSuccessModal(true);

      // Refresh data
      await fetchInitialData();
      await refreshBalances();
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  const Header = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-between"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {company.name}
          </h1>
          {company.status === 'verified' ? (
            <div className="flex items-center gap-1 bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-bold">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED ENTITY
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
              <Clock className="w-3 h-3" /> PENDING VERIFICATION
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Reg: {company.registrationNumber} • Compliance Year: {company.complianceYear || 2026}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Solana Wallet Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 bg-green-500/10 text-green-500 text-xs px-3 py-1.5 rounded-full font-bold">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Solana Wallet Connected
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              variant="outline"
              size="sm"
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold"
              disabled={web3Loading}
            >
              {web3Loading ? 'Connecting...' : 'Connect Solana Wallet'}
              <Wallet className="ml-2 w-3 h-3" />
            </Button>
          )}
        </div>

        <Button variant="outline" className="gap-2 border-primary/20">
          <ShieldCheck className="w-4 h-4" /> ESG Compliance
        </Button>
      </div>
    </motion.div>
  );

  const Stats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard
        title="Allocated CC"
        value={company.allocatedCC || 0}
        subtitle={company.requestStatus === 'requested' ? "Allocation Pending..." : "Credits assigned by Gov"}
        icon={Leaf}
        variant="primary"
        delay={0}
      />
      <StatCard
        title="Req Limit"
        value={company.requiredCC || 0}
        subtitle="Requested Volume"
        icon={ArrowRightCircle}
        variant="default"
        delay={0.1}
      />
      <StatCard
        title="Available Funds"
        value={`₹${((company.walletBalance || 0) / 100000).toFixed(2)}L`}
        subtitle="Corporate holding"
        icon={Wallet}
        variant="gold"
        delay={0.2}
      />
      <StatCard
        title="SOL Balance"
        value={`${parseFloat(ethBalance).toFixed(4)} SOL`}
        subtitle={isConnected ? "Solana Wallet Wallet" : "Not Connected"}
        icon={CreditCard}
        variant="secondary"
        delay={0.3}
      />
      <StatCard
        title="Gov Balance"
        value={`${governmentBalance.toFixed(0)} CC`}
        subtitle="Available from Gov"
        icon={ShieldCheck}
        variant="primary"
        delay={0.4}
      />
    </div>
  );

  const ActionSection = () => {
    // 1. If Allocation Needed (Request Phase)
    if (!company.allocatedCC || company.allocatedCC === 0) {
      if (company.requestStatus === 'requested') {
        return (
          <GlassCard className="p-8 text-center space-y-4 border-primary/30">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Request Pending</h3>
            <p className="text-muted-foreground">
              You have requested <strong>{company.requiredCC} CC</strong>.
              Average government processing time is 24 hours.
            </p>
          </GlassCard>
        );
      }
      return (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> Request Carbon Credits
          </h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">Enter Volume (CC)</p>
              <Input
                value={requestAmount}
                onChange={e => setRequestAmount(e.target.value)}
                placeholder="e.g. 1000"
                type="number"
              />
            </div>
            <Button onClick={handleRequestCC} disabled={isRequesting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isRequesting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </GlassCard>
      );
    }

    // 2. Allocation Done - Payment Phase
    if (company.paymentStatus === 'paid') {
      return (
        <GlassCard className="p-8 text-center space-y-4 border-success/30 bg-success/5">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-success">Compliance Met</h3>
            <p className="text-muted-foreground mt-2">
              Payment of ₹{((company.allocatedCC * CC_PRICE) / 100000).toFixed(2)}L has been settled.
              <br />Credits are active for Year {company.complianceYear || 2026}.
            </p>
          </div>
          <Button
            className="w-full h-12 bg-success hover:bg-success/90 text-white font-bold gap-2 text-lg shadow-lg shadow-success/20"
            onClick={() => setShowCertificate(true)}
          >
            <FileBadge className="w-6 h-6" /> Generate Certificate
          </Button>
        </GlassCard>
      );
    }

    // 3. Pending Payment (Solana Wallet + QR Modal Options)
    const amountToPay = company.allocatedCC * CC_PRICE;
    return (
      <GlassCard className="p-8 border-earth-gold/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Wallet className="text-earth-gold" /> Payment Required
          </h3>
          <p className="text-muted-foreground mb-6 max-w-lg">
            Standard Rate: ₹{CC_PRICE}/CC • Government Allocation: {company.allocatedCC} CC
            <br />Choose your preferred payment method to activate credits.
          </p>

          {/* Web3 Status */}
          <div className="mb-6 p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Blockchain Status</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? (
                <>
                  <div>Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</div>
                  <div>SOL Balance: {parseFloat(ethBalance).toFixed(4)} SOL</div>
                  <div>Gov CC Available: {governmentBalance.toFixed(0)} CC</div>
                </>
              ) : (
                <div>Connect Solana Wallet to enable blockchain payments</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="text-2xl font-mono font-bold text-earth-gold">
                ₹{amountToPay.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                ({company.allocatedCC} CC × ₹{CC_PRICE})
              </div>
            </div>

            <div className="flex gap-3">
              {/* Solana Wallet Payment Button */}
              {isConnected ? (
                <Button
                  onClick={() => setShowSolanaWalletModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 shadow-lg"
                  disabled={web3Loading}
                >
                  {web3Loading ? 'Processing...' : 'Pay with Solana Wallet'}
                  <Wallet className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={connectWallet}
                  variant="outline"
                  className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold px-6"
                  disabled={web3Loading}
                >
                  {web3Loading ? 'Connecting...' : 'Connect Solana Wallet'}
                  <Wallet className="ml-2 w-4 h-4" />
                </Button>
              )}

              {/* Traditional QR Payment */}
              <Button
                onClick={() => setShowQRModal(true)}
                className="bg-earth-gold hover:bg-earth-gold/90 text-black font-bold px-6 shadow-lg shadow-earth-gold/20"
              >
                Pay with UPI <QrCode className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>

          {web3Error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-500 text-sm">{web3Error}</p>
            </div>
          )}
        </div>
      </GlassCard >
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <Header />
        <Stats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {(view === 'dashboard' || view === 'credits') && <ActionSection />}

            {(view === 'dashboard' || view === 'transactions') && (
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Transaction History</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <TransactionList transactions={transactions.filter(t => t.fromEntity === company.name || t.toEntity === company.name)} observerEntity={company.name} />
              </GlassCard>
            )}

            {view === 'compliance' && (
              <div className="space-y-6">
                <ActionSection />
                <GlassCard className="p-8 text-center border-dashed border-2 py-12">
                  <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold">Compliance Status: {company.paymentStatus === 'paid' ? 'ACTIVE' : 'PENDING'}</h3>
                  <p className="text-muted-foreground mt-2">All regulatory filings for {company.complianceYear} are up to date.</p>
                </GlassCard>
              </div>
            )}
          </div>

          {/* Profile Sidebar */}
          {(view === 'dashboard' || view === 'credits' || view === 'compliance') && (
            <div className="space-y-6">
              <GlassCard>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Company Details
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Legal Name</span>
                    <span className="font-medium">{company.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Reg No.</span>
                    <span className="font-medium">{company.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Req Status</span>
                    <span className="font-medium capitalize">{company.requestStatus || 'None'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Compliance Year</span>
                    <span className="font-medium">{company.complianceYear}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* Transaction Success Modal */}
        {showSuccessModal && transactionData && (
          <TransactionSuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            transactionHash={transactionData.hash}
            ccAmount={transactionData.ccAmount}
            ethAmount={transactionData.ethAmount}
          />
        )}

        {/* Solana Wallet Payment Modal */}
        {showSolanaWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md p-6 text-center shadow-2xl border-orange-500/50">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mx-auto mb-4">
                <Wallet className="w-8 h-8 text-orange-500" />
              </div>

              <h3 className="text-xl font-bold mb-2">Solana Wallet Payment</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Secure blockchain transaction on Sepolia testnet
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Carbon Credits</span>
                    <span className="font-bold">{company.allocatedCC} CC</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Payment Amount</span>
                    <span className="font-bold">0.001 SOL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Balance</span>
                    <span className="font-bold">{parseFloat(ethBalance).toFixed(4)} SOL</span>
                  </div>
                </div>

                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Blockchain Details</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Network: Solana Testnet</div>
                    <div>Gov Wallet: {governmentBalance.toFixed(0)} CC Available</div>
                    <div>Contract: 0xEAFB...6aE7</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSolanaWalletPayment}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12"
                  disabled={web3Loading}
                >
                  {web3Loading ? 'Processing Transaction...' : 'Confirm Payment'}
                  <Wallet className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSolanaWalletModal(false)}
                  className="w-full text-muted-foreground"
                  disabled={web3Loading}
                >
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* QR Payment Modal */}
        {
          showQRModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <GlassCard className="w-full max-w-sm p-6 text-center shadow-2xl border-earth-gold/50">
                <h3 className="text-xl font-bold mb-2">Secure Payment Gateway</h3>
                <p className="text-xs text-muted-foreground mb-4">Scan using any UPI App</p>

                <div className="w-48 h-48 bg-white mx-auto rounded-xl p-2 mb-6 shadow-inner flex items-center justify-center">
                  {/* Simulated QR Pattern */}
                  <div className="w-full h-full border-4 border-black border-dashed rounded-lg flex flex-col items-center justify-center text-black">
                    <QrCode className="w-16 h-16 opacity-80" />
                    <span className="text-[10px] font-mono mt-2 font-bold">GOV-UPI-PAY</span>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg mb-6">
                  <p className="text-sm text-muted-foreground">Amount Payable</p>
                  <p className="text-2xl font-bold text-earth-gold">₹{(company.allocatedCC * CC_PRICE).toLocaleString()}</p>
                </div>

                <div className="space-y-3">
                  <Button onClick={handlePaymentConfirm} className="w-full bg-success hover:bg-success/90 text-white font-bold h-12">
                    I Have Paid <CheckCircle2 className="ml-2 w-4 h-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setShowQRModal(false)} className="w-full text-muted-foreground">
                    Cancel Transaction
                  </Button>
                </div>
              </GlassCard>
            </div>
          )
        }

        {/* Certificate View Overlay */}
        {
          showCertificate && (
            <CertificateView
              companyName={company.name}
              allocatedCC={company.allocatedCC || 0}
              complianceYear={company.complianceYear || 2026}
              onClose={() => setShowCertificate(false)}
            />
          )
        }

      </div >
    </DashboardLayout >
  );
};

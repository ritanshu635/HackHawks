import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Leaf,
  TrendingUp,
  Wallet,
  Calendar,
  Eye,
  FileText,
  Check,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CC_PRICE } from '@/types/carbon';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/StatCard';
import { TransactionList } from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';

export const GovernmentDashboard = () => {
  const {
    governmentStats,
    transactions,
    monthlyData,
    farmers,
    companies,
    fetchInitialData,
    verifyFarmer,
    verifyCompany,
    allocateCC,
    processFarmerPayout,
    approveDisasterRelief
  } = useCarbonStore();



  // ... (inside component)
  const { isConnected, connectWallet, walletAddress } = useWeb3();
  const [blockchainBalance, setBlockchainBalance] = useState<number>(0);
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchInitialData();
    // Use isConnected from Web3Context instead of local check
    setIsBlockchainConnected(isConnected);
  }, [isConnected]);

  // ... (keeping other functions like synchronizeWithBlockchain)

  const synchronizeWithBlockchain = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/blockchain/sync', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setBlockchainBalance(data.balance);
        await fetchInitialData(); // Refresh local data
        console.log('✅ Synchronized with blockchain');
      }
    } catch (error) {
      // Silent fail or log
      console.log('Blockchain sync skipped');
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = governmentStats || {
    ccWalletBalance: blockchainBalance || 490196, // Use blockchain balance
    totalCCGenerated: 0,
    walletBalance: 0,
    totalFarmersPaid: 0,
    totalFarmers: 0,
    totalCompanies: 0,
  };

  const pendingFarmers = (farmers || []).filter(f => f.status === 'pending');
  const verifiedFarmers = (farmers || []).filter(f => f.status === 'verified');
  const pendingCompanies = (companies || []).filter(c => c.status === 'pending');
  const verifiedCompanies = (companies || []).filter(c => c.status === 'verified');
  const disasterRequests = (farmers || []).filter(f => f.disasterStatus === 'pending');
  const decSubmissions = (farmers || []).filter(f => f.decemberLogged);

  const handleAllocate = async (companyId: string) => {
    const amount = prompt("Enter CC Amount to allocate:", "1000");
    const years = prompt("Enter Compliance Years:", "5");
    if (amount && years) {
      try {
        // Check if Wallet is connected
        if (!isConnected) {
          alert("Please connect Phantom wallet first");
          await connectWallet();
          return;
        }

        // Show confirmation dialog
        const company = companies.find(c => c.id === companyId);
        const confirmMsg = `Allocate ${amount} CC to ${company?.name}?\n\nThis will:\n1. Open Phantom for Solana transaction\n2. Deduct ${amount} CC from government wallet\n3. Sync with Green Ledger India`;

        if (!confirm(confirmMsg)) return;

        // Call Solana service for real blockchain transaction
        try {
          // Import service dynamically or use context method if available
          // Since we already have the logic in solanaBlockchainIntegration, let's use it directly or via a new context method
          // But better to use the service directly here for simplicity as we didn't add allocate to Web3Context

          const { blockchainIntegration } = await import('@/services/solanaBlockchainIntegration');

          // Generate an allocation ID
          const allocationId = `alloc_${Date.now()}`;

          // Call allocate
          const transactionHash = await blockchainIntegration.allocateCreditsToCompany(
            'company_wallet_placeholder', // needed if we track on chain
            Number(amount),
            allocationId
          );

          console.log('✅ Solana transaction signature:', transactionHash);

          // Call the allocation API with real transaction hash
          await allocateCC(companyId, Number(amount), Number(years), transactionHash);

          // Trigger cross-platform sync to Green Ledger India
          try {
            // Store sync event for Green Ledger India to pick up
            localStorage.setItem('carbon_purchase_sync_event', JSON.stringify({
              type: 'balance_update',
              ccAmount: Number(amount),
              source: 'carbon-bloom-connect',
              transactionHash: transactionHash,
              companyId: companyId,
              timestamp: new Date().toISOString(),
              operation: 'purchase'
            }));

            // Remove after a short delay to allow other tabs to process
            setTimeout(() => {
              localStorage.removeItem('carbon_purchase_sync_event');
            }, 1000);

            console.log('✅ Cross-platform sync event triggered for Green Ledger India');
          } catch (syncError) {
            console.warn('⚠️ Failed to trigger sync event:', syncError);
          }

          alert(`✅ Allocation Successful!\n\n${amount} CC allocated to ${company?.name}\nTransaction: ${transactionHash}\n\nBalance updated in both platforms`);

        } catch (solanaError: any) {
          console.error('Solana error:', solanaError);
          alert(`Solana transaction failed: ${solanaError.message}`);
        }

      } catch (error: any) {
        alert(`Allocation failed: ${error.message}`);
      }
    }
  };

  const handlePayout = async (farmerId: string) => {
    try {
      const farmer = farmers.find(f => f.id === farmerId);
      const isDisaster = farmer?.disasterStatus === 'approved';
      const promptMsg = isDisaster
        ? "Confirm yearly settlement (CC * ₹2000 + 8% Disaster Bonus) for this farmer?"
        : "Confirm yearly settlement (CC * ₹2000) for this farmer?";

      if (confirm(promptMsg)) {
        await processFarmerPayout(farmerId);
        alert("Settlement processed and transmitted to farmer's wallet.");
      }
    } catch (err: any) {
      alert(err.message || err);
    }
  };

  const handleDisasterApprove = (farmerId: string) => {
    const amount = prompt("Enter Payout Amount (₹):", "50000");
    if (amount) {
      approveDisasterRelief(farmerId, Number(amount));
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border-border bg-background/80 backdrop-blur-md shadow-xl text-xs">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-primary">Generation: {payload[0].value.toFixed(2)} CC</p>
          <p className="text-earth-gold">Allocation: {payload[1].value.toFixed(2)} CC</p>
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-muted-foreground italic">Latest Allocation:</p>
            <p className="font-medium">{verifiedCompanies[0]?.name || 'N/A'}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const Header = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Government Control Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Validating carbon records and facilitating credit flow
        </p>
      </div>
      <div className="flex gap-4">
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isBlockchainConnected ? 'bg-success' : 'bg-warning'}`} />
          <span className="text-sm font-medium">
            {isBlockchainConnected ? 'Blockchain Connected' : 'Local Mode'}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={synchronizeWithBlockchain}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Blockchain'}
        </Button>
        {isBlockchainConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://sepolia.etherscan.io/', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Etherscan
          </Button>
        )}
      </div>
    </motion.div>
  );

  const Stats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total CC in Gov Wallet"
        value={stats.ccWalletBalance.toFixed(2)}
        subtitle={
          <div className="flex items-center gap-2">
            <span>Available for allocation</span>
            {isBlockchainConnected && (
              <Badge variant="outline" className="text-xs">
                Blockchain Verified
              </Badge>
            )}
          </div>
        }
        icon={Leaf}
        variant="primary"
        delay={0}
      />
      <StatCard
        title="Stored Funds (Rs)"
        value={`₹${(stats.walletBalance / 100000).toFixed(2)}L`}
        subtitle="From companies for farmers"
        icon={Wallet}
        variant="gold"
        delay={0.1}
      />
      <StatCard
        title="Verified Farmers"
        value={verifiedFarmers.length}
        subtitle={`${pendingFarmers.length} pending verification`}
        icon={Users}
        variant="secondary"
        delay={0.2}
      />
      <StatCard
        title="System CC Volume"
        value={stats.totalCCGenerated.toFixed(2)}
        subtitle="Generated by all farmers"
        icon={TrendingUp}
        variant="default"
        delay={0.3}
      />
    </div>
  );

  const FarmerOperations = () => {
    const activeFarmers = (farmers || []).filter(f =>
      f.status === 'pending' || (f.status === 'verified' && f.decemberLogged)
    );

    const DocumentReview = ({ farmer }: { farmer: any }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/30 hover:bg-primary/5 text-primary">
            <Eye className="w-3.5 h-3.5" /> View Docs
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Document Verification
            </DialogTitle>
            <div className="sr-only">
              <p>Verify farmer identity and land ownership documents.</p>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Submitted Files</p>
              <div className="space-y-3">
                {[
                  { label: 'Aadhaar Card', file: farmer.aadhaar_doc },
                  { label: 'Land Record', file: farmer.land_doc },
                  { label: 'Bank Details', file: farmer.bank_doc }
                ].map(doc => (
                  <div key={doc.label} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">{doc.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{doc.file || 'Not Uploaded'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <p className="text-xs leading-relaxed">
                Review the above documents against official records. Once verified, the farmer's Land ID will be activated for CC generation.
              </p>
            </div>

            <Button
              className="w-full h-11 gradient-primary font-bold"
              onClick={() => verifyFarmer(farmer.id)}
            >
              <Check className="w-4 h-4 mr-2" /> Approve Verification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );

    return (
      <GlassCard delay={0.1}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Farmer Operations
          </h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">{activeFarmers.length} Action(s)</span>
        </div>
        <div className="space-y-3">
          {activeFarmers.length === 0 ? (
            <p className="text-sm text-center py-8 text-muted-foreground">No pending actions.</p>
          ) : (
            activeFarmers.map(f => (
              <div key={f.id} className="flex flex-col gap-2 p-3 glass-panel border-border/30 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">Land ID: {f.landId} • {f.landSize} Acres</p>
                  </div>
                  {f.status === 'pending' ? (
                    <DocumentReview farmer={f} />
                  ) : (
                    <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">VERIFIED</span>
                  )}
                </div>
                {f.status === 'verified' && f.decemberLogged && (
                  <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> DEC LOGGED
                      </span>
                      {f.disasterStatus === 'approved' && (
                        <span className="text-[7px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          +8% DISASTER BONUS
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePayout(f.id)}
                      disabled={f.disasterStatus === 'pending'}
                      className="h-7 bg-earth-gold text-white hover:bg-earth-gold/90 text-[10px]"
                    >
                      {f.disasterStatus === 'pending' ? 'Pending Claim' : 'Process Settlement'}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>
    );
  };

  const DisasterQueue = () => (
    <GlassCard delay={0.1} className="border-destructive/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-destructive" /> Relief Queue
        </h3>
        <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-bold">{disasterRequests.length} Pending</span>
      </div>
      <div className="space-y-3">
        {disasterRequests.length === 0 ? (
          <p className="text-sm text-center py-8 text-muted-foreground">No pending disaster claims.</p>
        ) : (
          disasterRequests.map(f => (
            <div key={f.id} className="flex flex-col gap-2 p-3 glass-panel border-destructive/20 bg-destructive/5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">{f.name}</p>
                <Button size="sm" onClick={() => handleDisasterApprove(f.id)} className="h-7 bg-destructive text-white hover:bg-destructive/90 text-[10px]">Approve Insurance</Button>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">" {f.disasterDescription} "</p>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );

  const CompanyManagement = () => {
    const CompanyDocumentReview = ({ company }: { company: any }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2 border-earth-gold/30 hover:bg-earth-gold/5 text-earth-gold text-[10px]">
            <Eye className="w-3.5 h-3.5" /> View Docs
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-earth-gold" />
              Company Verification
            </DialogTitle>
            <div className="sr-only">
              <p>Review company registration and compliance documents.</p>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Submitted Documents</p>
              <div className="p-2 rounded-lg bg-background/50 border border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-earth-gold" />
                  <span className="text-sm">Registration Certificate (CIN/GST)</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{company.registration_doc || 'manual_entry.pdf'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-earth-gold/10 rounded-xl border border-earth-gold/20">
              <ShieldCheck className="w-5 h-5 text-earth-gold" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Inspect the legal registration certificate for <span className="text-foreground font-bold">{company.name}</span>. Ensure the CIN matches official MCA records before approval.
              </p>
            </div>

            <Button
              className="w-full h-11 bg-earth-gold text-white hover:bg-earth-gold/90 font-bold"
              onClick={() => verifyCompany(company.id)}
            >
              <Check className="w-4 h-4 mr-2" /> Approve Company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. CC Request Queue */}
        <GlassCard delay={0.1} className="border-orange-600/20 bg-orange-600/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2 text-orange-600">
              <Leaf className="w-4 h-4" /> CC Requests
            </h3>
            <span className="text-[10px] bg-orange-600/10 text-orange-600 px-2 py-0.5 rounded-full font-bold">
              {(companies || []).filter(c => c.requestStatus === 'requested').length}
            </span>
          </div>
          <div className="space-y-3">
            {(companies || []).filter(c => c.requestStatus === 'requested').length === 0 ? (
              <p className="text-[10px] text-center py-4 text-muted-foreground italic">No requests</p>
            ) : (
              (companies || []).filter(c => c.requestStatus === 'requested').map(c => (
                <div key={c.id} className="p-3 glass-panel border-orange-500/30 bg-background/40">
                  <p className="font-bold text-xs mb-1">{c.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-mono font-bold text-orange-600">{c.requiredCC} CC</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        const amount = prompt(`Allocate to ${c.name}:`, c.requiredCC.toString());
                        if (amount) allocateCC(c.id, Number(amount), 1);
                      }}
                      className="h-7 px-3 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold"
                    >
                      Allocate
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* 2. Verification Queue */}
        <GlassCard delay={0.2} className="border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
              <ShieldCheck className="w-4 h-4" /> KYC Queue
            </h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{pendingCompanies.length}</span>
          </div>
          <div className="space-y-3">
            {pendingCompanies.length === 0 ? (
              <p className="text-[10px] text-center py-4 text-muted-foreground italic">All verified</p>
            ) : (
              pendingCompanies.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 glass-panel border-primary/20 bg-background/40">
                  <span className="font-bold text-xs truncate mr-2">{c.name}</span>
                  <CompanyDocumentReview company={c} />
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* 3. Verified Company Directory */}
        <GlassCard delay={0.3}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2 text-earth-gold">
              <Building2 className="w-4 h-4" /> Directory
            </h3>
            <span className="text-[10px] bg-earth-gold/10 text-earth-gold px-2 py-0.5 rounded-full font-bold">{verifiedCompanies.length}</span>
          </div>
          <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {verifiedCompanies.length === 0 ? (
              <p className="text-[10px] text-center py-4 text-muted-foreground italic">No companies</p>
            ) : (
              verifiedCompanies.map(c => (
                <div key={c.id} className="p-2 glass-panel border-border/20 bg-background/20 flex items-center justify-between">
                  <span className="text-xs font-medium truncate max-w-[100px]">{c.name}</span>
                  {(c.allocatedCC || 0) > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${c.paymentStatus === 'paid' ? 'bg-success/20 text-success' : 'bg-orange-500/20 text-orange-500'}`}>
                        {c.paymentStatus === 'paid' ? 'SETTLED' : 'DUE'}
                      </span>
                      {c.paymentStatus !== 'paid' && (
                        <span className="text-[9px] font-mono font-bold text-earth-gold">₹{((c.allocatedCC || 0) * CC_PRICE).toLocaleString()}</span>
                      )}
                    </div>
                  ) : <span className="text-[8px] text-muted-foreground uppercase">Inactive</span>}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    );
  };

  const AnalyticsChart = () => (
    <GlassCard className="lg:col-span-2" delay={0.1}>
      <div className="mb-6">
        <h3 className="font-display font-semibold text-lg">Platform Credit Flow</h3>
        <p className="text-sm text-muted-foreground">Monthly generation vs allocation trends</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="ccGenerated" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorGen)" />
          <Area type="monotone" dataKey="ccAllocated" stroke="hsl(var(--earth-gold))" fillOpacity={0} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );

  const LedgerView = () => (
    <GlassCard delay={0.1}>
      <h3 className="font-display font-semibold text-lg mb-4">Live Ledger</h3>
      <TransactionList transactions={transactions} maxItems={20} hideGeneration={true} observerEntity="Government" />
    </GlassCard>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header />

        {/* Individual Payout Eligibility */}
        {decSubmissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Year-End Settlements Available</h4>
                <p className="text-xs text-muted-foreground">{decSubmissions.length} farmers have logged December data and are eligible for individual payouts.</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Action Required in List Below</div>
          </motion.div>
        )}

        <Routes>
          <Route path="/" element={
            <>
              <Stats />
              <CompanyManagement />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                  <AnalyticsChart />
                  <LedgerView />
                </div>

                {/* Sidebar Operations */}
                <div className="lg:col-span-4 space-y-6">
                  <FarmerOperations />
                  <DisasterQueue />
                </div>
              </div>
            </>
          } />
          <Route path="farmers" element={<FarmerOperations />} />
          <Route path="companies" element={<CompanyManagement />} />
          <Route path="credits" element={<DisasterQueue />} />
          <Route path="transactions" element={<LedgerView />} />
          <Route path="analytics" element={<AnalyticsChart />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
};

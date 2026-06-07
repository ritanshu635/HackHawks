import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Leaf,
  Wallet,
  Wheat,
  TrendingUp,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/StatCard';
import { TransactionList } from '@/components/TransactionList';
import { CROP_CC_PER_ACRE, CC_PRICE, CropType } from '@/types/carbon';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { FileText, ShieldCheck } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';

export const FarmerDashboard = () => {
  const { farmers, transactions, ccArchives, currentUserId, logMonth, raiseDisasterRelief, fetchInitialData } = useCarbonStore();
  const [lMonth, setLMonth] = useState<string>('');
  const [lYear, setLYear] = useState<string>('2026'); // Default to 2026 as requested
  const [lCrop, setLCrop] = useState<string>('wheat');
  const [showDisasterModal, setShowDisasterModal] = useState(false);
  const [disasterDesc, setDisasterDesc] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Dynamic user lookup
  const farmer = (farmers || []).find(f => f.id === currentUserId) || (farmers && farmers[0]) || null;

  if (!farmer) return <div className="p-20 text-center">Loading Farmer Data...</div>;

  // VERIFICATION CHECK
  if (farmer.status === 'pending') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-earth-gold/20 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-10 h-10 text-earth-gold" />
          </div>
          <h1 className="text-3xl font-display font-bold">Verification In Progress</h1>
          <p className="text-muted-foreground">
            Your account for <strong>{farmer.name}</strong> has been created.
            The Government is currently validating your land record (ID: {farmer.landId}).
            Once verified, you will be able to log your monthly crops and earn Carbon Credits.
          </p>
          <div className="pt-6">
            <Button disabled variant="outline" className="opacity-50">Log Monthly Progress (Locked)</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredTransactions = (transactions || []).filter(
    t => t.fromEntity === farmer.name || t.toEntity === farmer.name
  );

  const activeYearCC = (farmer.totalCCGenerated || 0) - (ccArchives || []).reduce((sum, a) => sum + (a.cc_produced || 0), 0);

  const handleManualLog = async () => {
    if (!lMonth) return alert("Please select a month");
    try {
      await logMonth(farmer.id, {
        month: Number(lMonth),
        year: Number(lYear),
        crop: lCrop
      });
      alert(`Successfully logged ${lCrop} for Month ${lMonth}. Credits transmitted to Government.`);
    } catch (err: any) { alert(err.message); }
  };

  const handleDisasterSubmit = async () => {
    if (!disasterDesc) return alert("Please specify the calamity details");
    try {
      await raiseDisasterRelief(farmer.id, disasterDesc);
      alert("Disaster relief application submitted to Government.");
      setShowDisasterModal(false);
    } catch (err: any) { alert(err.message); }
  };


  const Header = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome, {farmer.name}
          </h1>
          <div className="flex items-center gap-1 bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-bold">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Land ID: {farmer.landId} • {farmer.landSize} acres • Sowing Year: {farmer.sowingYear || 2026}
        </p>
      </div>
      <div className="flex gap-4">
        <Button
          onClick={() => setShowDisasterModal(true)}
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          disabled={farmer.disasterStatus === 'pending'}
        >
          {farmer.disasterStatus === 'pending' ? 'Relief Pending...' : 'Raise Calamity Request'}
        </Button>
        <div className="glass-panel px-4 py-2">
          <p className="text-xs text-muted-foreground">Current Crop</p>
          <p className="font-semibold text-primary capitalize">{farmer.currentCrop}</p>
        </div>
      </div>
    </motion.div>
  );

  const Stats = () => {
    const loanTotal = (transactions || [])
      .filter(t => t.type === 'emergency_loan' && (t.toEntity === farmer.name || t.fromEntity === farmer.name))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const moneyBreakdown = (ccArchives || [])
      .filter(a => a.payout_amount > 0)
      .map(a => ({
        label: `Year ${a.year}`,
        value: `₹${a.payout_amount.toLocaleString()}${a.interest_amount > 0 ? ` (+₹${a.interest_amount.toLocaleString()})` : ''}`
      }));

    if (activeYearCC > 0 && farmer.walletBalance > (ccArchives || []).reduce((s, a) => s + a.payout_amount + a.interest_amount, 0)) {
      // Estimate current earnings if any
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total CC Generated"
          value={(farmer.totalCCGenerated || 0).toFixed(2)}
          subtitle="Life Cycle Volume"
          icon={Leaf}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Money from Government"
          value={`₹${(farmer.walletBalance || 0).toLocaleString()}`}
          subtitle="Interest Settlements"
          icon={Wallet}
          variant="gold"
          delay={0.1}
          breakdown={moneyBreakdown}
        />
        <StatCard
          title="Insurance Fund"
          value={`₹${(farmer.insuranceFund || 0).toLocaleString()}`}
          subtitle="Saved 10% Interest (Locked)"
          icon={ShieldCheck}
          variant="primary"
          delay={0.2}
        />
        <StatCard
          title="Loan Money"
          value={`₹${(loanTotal / 1000).toFixed(1)}K`}
          subtitle="Disbursed Emergency Funds"
          icon={TrendingUp}
          variant="secondary"
          delay={0.3}
        />
      </div>
    );
  };

  const ArchivesDialog = () => {
    const years = [...(ccArchives || [])].sort((a, b) => b.year - a.year);

    return (
      <Dialog>
        <DialogTrigger asChild>
          <GlassCard
            className="flex items-center justify-between p-6 border-earth-gold/20 group hover:border-earth-gold transition-all cursor-pointer"
          >
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Historical Performance</p>
              <h4 className="text-2xl font-bold mt-1 text-earth-gold">Archived Projects</h4>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> View settlements from {years.length > 0 ? years[years.length - 1].year : 'past'} - {years.length > 0 ? years[0].year : 'present'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-earth-gold/10 flex items-center justify-center group-hover:bg-earth-gold/20 transition-colors">
              <FileText className="text-earth-gold w-6 h-6" />
            </div>
          </GlassCard>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-popover/95 backdrop-blur-xl border-border/50 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-earth-gold" />
              Annual Credit Archives
            </DialogTitle>
            <div className="sr-only">
              <p>View all past yearly carbon credit settlements and summaries.</p>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {years.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-muted-foreground">
                <Leaf className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No archived projects found yet.</p>
              </div>
            ) : (
              years.map((archive) => (
                <div
                  key={archive.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{archive.year} Cycle</span>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {archive.crop_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-bold">{(archive.cc_produced || 0).toFixed(2)} CC</p>
                      <p className="text-xs text-muted-foreground">{archive.land_size} Acres</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-earth-gold">₹{archive.payout_amount.toLocaleString()}</p>
                      <p className="text-[10px] text-success">Settled</p>
                    </div>
                  </div>
                  {archive.interest_amount > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[10px] text-primary flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> ₹{archive.interest_amount.toLocaleString()} Added to Insurance Fund
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const YearlySummaries = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <GlassCard className="flex items-center justify-between p-6 border-primary/20 hover:border-primary transition-all">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Year {farmer.sowingYear || 2026} Summary</p>
            <h4 className="text-2xl font-bold mt-1 text-primary">{(activeYearCC || 0).toFixed(2)} CC</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-success font-medium mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              ACTIVE CYCLE
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="text-primary w-6 h-6" />
          </div>
        </GlassCard>

        <ArchivesDialog />
      </div>
    );
  };

  const CropManagement = () => (
    <GlassCard className="p-8 max-w-md h-full" delay={0.1}>
      <h3 className="font-display font-semibold text-lg mb-2 text-primary flex items-center gap-2">
        <Calendar className="w-5 h-5" /> Log Monthly Entry
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Manual submission for credit generation
      </p>
      <div className="space-y-4">
        {farmer.decemberLogged ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <h4 className="font-bold text-success">Year Complete</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You have logged December for {farmer.sowingYear || lYear}.
              <br />
              Settlement is pending/completed.
              <br />
              <span className="text-xs italic">Log for new year will unlock after payout.</span>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Year</Label>
                <Select value={lYear} onValueChange={setLYear}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {['2024', '2025', '2026', '2027'].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Month</Label>
                <Select value={lMonth} onValueChange={setLMonth}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Monthly Crop</Label>
              <Select value={lCrop} onValueChange={setLCrop}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Crop Name" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CROP_CC_PER_ACRE).map(([crop, rate]) => (
                    <SelectItem key={crop} value={crop} className="capitalize">
                      {crop} ({rate} CC/yr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Estimated Auto-Calculation</p>
              <p className="text-xl font-bold text-primary">
                {lCrop ? (CROP_CC_PER_ACRE[lCrop as CropType] / 12).toFixed(2) : '0.00'} CC
              </p>
              <p className="text-[10px] text-muted-foreground">(Based on strict table rates)</p>
            </div>

            <Button onClick={handleManualLog} className="w-full h-11 gradient-primary font-bold shadow-lg shadow-primary/20">Submit Entry</Button>
            <p className="text-[10px] text-muted-foreground text-center italic mt-2">
              * Notice: Entry will automatically credit all preceding unlogged months for {lYear}.
            </p>
          </>
        )}
      </div>
    </GlassCard>
  );

  const WalletView = () => (
    <GlassCard className="flex flex-col h-full" delay={0.1}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-earth-gold" /> Payment History
        </h3>
        <span className="text-[10px] bg-earth-gold/10 text-earth-gold px-2 py-0.5 rounded-full font-bold">LATEST UPDATED</span>
      </div>
      <TransactionList transactions={transactions} maxItems={10} observerEntity={farmer.name} hideGeneration={true} />
    </GlassCard>
  );

  const PaymentGraph = () => {
    const data = [...(ccArchives || [])].sort((a, b) => a.year - b.year).map(a => ({
      year: String(a.year),
      payout: a.payout_amount,
    }));

    if (data.length === 0) return null;

    return (
      <GlassCard className="p-6 mt-6 border-dashed border-border/40 bg-transparent shadow-none" delay={0.2}>
        <div className="mb-8 flex justify-between items-center px-2">
          <div>
            <h4 className="text-sm font-bold tracking-tight text-muted-foreground uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-earth-gold" /> Settlement Path
            </h4>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="5 5" stroke="hsl(var(--border))" vertical={false} strokeOpacity={0.1} />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />
              <YAxis
                hide={true}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '5 5' }}
                contentStyle={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover/80 backdrop-blur-md border border-border/50 p-2 rounded-lg shadow-xl">
                        <p className="text-[10px] font-bold text-earth-gold">₹{payload[0].value?.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="payout"
                stroke="hsl(var(--earth-gold))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: 'hsl(var(--background))', stroke: 'hsl(var(--earth-gold))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--earth-gold))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <Header />

        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <>
              <Stats />
              <YearlySummaries />
              <PaymentGraph />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <CropManagement />
                <WalletView />
              </div>
            </>
          } />

          {/* Individual Sections from Sidebar */}
          <Route path="crops" element={<CropManagement />} />
          <Route path="wallet" element={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <StatCard
                  title="Money from Government"
                  value={`₹${(farmer.walletBalance || 0).toLocaleString()}`}
                  subtitle="Interest Settlements"
                  icon={Wallet}
                  variant="gold"
                />
                <StatCard
                  title="Insurance Fund"
                  value={`₹${(farmer.insuranceFund || 0).toLocaleString()}`}
                  subtitle="Saved 10% Interest (Locked)"
                  icon={ShieldCheck}
                  variant="primary"
                />
              </div>
              <WalletView />
            </div>
          } />
          <Route path="documents" element={<ArchivesDialog />} />
          <Route path="emergency" element={
            <GlassCard className="max-w-xl mx-auto p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-destructive">Calamity Relief Program</h2>
              <p className="text-muted-foreground">
                Apply for immediate financial assistance from your insurance fund in case of crop failure or natural disasters.
              </p>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-left">
                <p className="text-sm font-bold mb-2">Available Balance: ₹{(farmer.insuranceFund || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground italic">Claims are deducted directly from your locked interest savings.</p>
              </div>
              <Button
                onClick={() => setShowDisasterModal(true)}
                variant="destructive"
                className="w-full h-12 text-lg font-bold"
                disabled={farmer.disasterStatus === 'pending'}
              >
                {farmer.disasterStatus === 'pending' ? 'Claim Pending Approval...' : 'Raise New Claim'}
              </Button>
            </GlassCard>
          } />
        </Routes>
      </div>

      {/* Disaster Modal */}
      {showDisasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-destructive">
              <ShieldAlert /> Report Calamity
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Submit a request for crop failure compensation. This will pause your CC generation until resolved.
            </p>
            <Input
              value={disasterDesc}
              onChange={e => setDisasterDesc(e.target.value)}
              placeholder="Describe the disaster (e.g. Drought, Flood)"
              className="mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDisasterModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDisasterSubmit}>Submit Request</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
};

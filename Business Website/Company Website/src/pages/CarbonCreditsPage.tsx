import { motion } from 'framer-motion';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Building2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['hsl(142, 50%, 45%)', 'hsl(35, 60%, 50%)', 'hsl(45, 70%, 50%)', 'hsl(30, 30%, 25%)'];

export const CarbonCreditsPage = () => {
  const { governmentStats, monthlyData, generateMonthlyCC } = useCarbonStore();

  const pieData = [
    { name: 'Allocated to Companies', value: governmentStats.totalCCAllocated },
    { name: 'Consumed', value: governmentStats.totalCCUsed },
    { name: 'Available in Pool', value: governmentStats.ccWalletBalance },
    { name: 'Expired', value: governmentStats.totalCCExpired },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Carbon Credits
            </h1>
            <p className="text-muted-foreground mt-1">
              Government CC wallet and allocation management
            </p>
          </div>
          <Button 
            onClick={generateMonthlyCC}
            className="gradient-primary text-primary-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Monthly CC
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total CC Generated"
            value={governmentStats.totalCCGenerated}
            subtitle="All time"
            icon={Leaf}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="CC Pool Balance"
            value={governmentStats.ccWalletBalance}
            subtitle="Available for allocation"
            icon={Wallet}
            variant="secondary"
            delay={0.1}
          />
          <StatCard
            title="Total Allocated"
            value={governmentStats.totalCCAllocated}
            subtitle="To companies"
            icon={Building2}
            variant="gold"
            delay={0.2}
          />
          <StatCard
            title="CC Utilization"
            value={`${Math.round((governmentStats.totalCCUsed / governmentStats.totalCCAllocated) * 100)}%`}
            subtitle="Used by companies"
            icon={TrendingUp}
            variant="default"
            delay={0.3}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CC Flow Chart */}
          <GlassCard className="lg:col-span-2" delay={0.4}>
            <h3 className="font-display font-semibold text-lg mb-2">CC Generation Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">Monthly carbon credit generation from farmers</p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 50%, 45%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(142, 50%, 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 15%, 20%)" />
                <XAxis dataKey="month" stroke="hsl(45, 10%, 60%)" fontSize={12} />
                <YAxis stroke="hsl(45, 10%, 60%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(160, 15%, 10%)', 
                    border: '1px solid hsl(160, 15%, 20%)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ccGenerated" 
                  stroke="hsl(142, 50%, 45%)" 
                  fillOpacity={1} 
                  fill="url(#colorCC)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Distribution */}
          <GlassCard delay={0.5}>
            <h3 className="font-display font-semibold text-lg mb-2">CC Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">Current allocation status</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(160, 15%, 10%)', 
                    border: '1px solid hsl(160, 15%, 20%)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value} CC</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* CC Pool Info */}
        <GlassCard delay={0.6}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg">Government CC Pool</h3>
              <p className="text-sm text-muted-foreground">Central carbon credit aggregation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 text-center">
              <Leaf className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-3xl font-bold font-display text-primary">
                {governmentStats.ccWalletBalance}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Available CC</p>
            </div>
            <div className="glass-panel p-6 text-center">
              <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-3" />
              <p className="text-3xl font-bold font-display">
                {governmentStats.totalCCGenerated}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Generated</p>
            </div>
            <div className="glass-panel p-6 text-center">
              <ArrowUpRight className="w-10 h-10 text-earth-gold mx-auto mb-3" />
              <p className="text-3xl font-bold font-display">
                {governmentStats.totalCCAllocated}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Allocated</p>
            </div>
            <div className="glass-panel p-6 text-center">
              <Building2 className="w-10 h-10 text-success mx-auto mb-3" />
              <p className="text-3xl font-bold font-display">
                {governmentStats.totalCCUsed}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Used by Companies</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

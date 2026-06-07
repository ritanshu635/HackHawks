import { motion } from 'framer-motion';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/StatCard';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Leaf,
  CircleDollarSign,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';

export const AnalyticsPage = () => {
  const { governmentStats, monthlyData, farmers, companies } = useCarbonStore();

  const revenueData = monthlyData.map(m => ({
    ...m,
    profit: m.revenue - m.payments
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive platform insights and trends
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`₹${(governmentStats.walletBalance / 100000).toFixed(1)}L`}
            subtitle="From CC sales"
            icon={CircleDollarSign}
            trend={{ value: 18.5, isPositive: true }}
            variant="gold"
            delay={0}
          />
          <StatCard
            title="Active Farmers"
            value={farmers.length}
            subtitle="Registered this year"
            icon={Users}
            trend={{ value: 12.3, isPositive: true }}
            variant="primary"
            delay={0.1}
          />
          <StatCard
            title="Active Companies"
            value={companies.filter(c => c.approved).length}
            subtitle="Approved for trading"
            icon={Building2}
            variant="secondary"
            delay={0.2}
          />
          <StatCard
            title="CC Efficiency"
            value={`${Math.round((governmentStats.totalCCUsed / governmentStats.totalCCGenerated) * 100)}%`}
            subtitle="Generation to usage"
            icon={TrendingUp}
            variant="default"
            delay={0.3}
          />
        </div>

        {/* Revenue Chart */}
        <GlassCard delay={0.4}>
          <h3 className="font-display font-semibold text-lg mb-2">Revenue & Payments</h3>
          <p className="text-sm text-muted-foreground mb-4">Monthly financial flow</p>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45, 70%, 50%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(45, 70%, 50%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 15%, 20%)" />
              <XAxis dataKey="month" stroke="hsl(45, 10%, 60%)" fontSize={12} />
              <YAxis stroke="hsl(45, 10%, 60%)" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(160, 15%, 10%)', 
                  border: '1px solid hsl(160, 15%, 20%)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `₹${(value/1000).toFixed(0)}K`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                fill="url(#colorRevenue)" 
                stroke="hsl(45, 70%, 50%)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="payments" 
                stroke="hsl(142, 50%, 45%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142, 50%, 45%)' }}
              />
              <Bar 
                dataKey="ccGenerated" 
                fill="hsl(35, 60%, 50%)" 
                opacity={0.3}
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-earth-gold" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary opacity-50" />
              <span className="text-sm text-muted-foreground">CC Generated</span>
            </div>
          </div>
        </GlassCard>

        {/* CC Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard delay={0.5}>
            <h3 className="font-display font-semibold text-lg mb-2">CC Generation Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">Monthly carbon credit generation</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
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
                <Bar dataKey="ccGenerated" fill="hsl(142, 50%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard delay={0.6}>
            <h3 className="font-display font-semibold text-lg mb-2">CC Allocation Rate</h3>
            <p className="text-sm text-muted-foreground mb-4">Generated vs Allocated</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
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
                <Line 
                  type="monotone" 
                  dataKey="ccGenerated" 
                  stroke="hsl(142, 50%, 45%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 50%, 45%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ccAllocated" 
                  stroke="hsl(35, 60%, 50%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(35, 60%, 50%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-sm text-muted-foreground">Allocated</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

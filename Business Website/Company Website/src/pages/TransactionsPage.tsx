import { motion } from 'framer-motion';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { TransactionList } from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Leaf, 
  CircleDollarSign,
  Filter,
  Download
} from 'lucide-react';

export const TransactionsPage = () => {
  const { transactions } = useCarbonStore();

  const ccTransactions = transactions.filter(t => 
    t.type === 'cc_generation' || t.type === 'cc_allocation'
  );
  const moneyTransactions = transactions.filter(t => 
    t.type === 'cc_payment' || t.type === 'farmer_payment' || t.type === 'emergency_loan'
  );

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
              Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              All platform transactions and ledger entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border/50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="border-border/50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4" delay={0.1}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CC Generated</p>
                <p className="font-bold text-lg">{ccTransactions.filter(t => t.type === 'cc_generation').length}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" delay={0.15}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CC Allocated</p>
                <p className="font-bold text-lg">{ccTransactions.filter(t => t.type === 'cc_allocation').length}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" delay={0.2}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-earth-gold/20 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-earth-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payments Received</p>
                <p className="font-bold text-lg">{moneyTransactions.filter(t => t.type === 'cc_payment').length}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" delay={0.25}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Farmer Payments</p>
                <p className="font-bold text-lg">{moneyTransactions.filter(t => t.type === 'farmer_payment').length}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Transactions Tabs */}
        <GlassCard delay={0.3}>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-muted/30 border border-border/50">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="cc">Carbon Credits</TabsTrigger>
              <TabsTrigger value="money">₹ Payments</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <TransactionList transactions={transactions} maxItems={20} />
            </TabsContent>
            <TabsContent value="cc" className="mt-6">
              <TransactionList transactions={ccTransactions} maxItems={20} />
            </TabsContent>
            <TabsContent value="money" className="mt-6">
              <TransactionList transactions={moneyTransactions} maxItems={20} />
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

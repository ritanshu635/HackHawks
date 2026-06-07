import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Leaf,
  Building2,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  History,
  Activity
} from 'lucide-react';
import { Transaction } from '@/types/carbon';
import { formatDistanceToNow } from 'date-fns';

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
}

const typeIcons = {
  cc_generation: Leaf,
  cc_allocation: ArrowUpRight,
  cc_payment: CircleDollarSign,
  farmer_payment: ArrowDownLeft,
  cc_expiry: AlertCircle,
  emergency_loan: CircleDollarSign,
  disaster_relief: ShieldAlert,
  cc_usage: Activity,
};

const typeColors = {
  cc_generation: 'text-primary bg-primary/10 border-primary/30',
  cc_allocation: 'text-secondary bg-secondary/10 border-secondary/30',
  cc_payment: 'text-earth-gold bg-earth-gold/10 border-earth-gold/30',
  farmer_payment: 'text-success bg-success/10 border-success/30',
  cc_expiry: 'text-destructive bg-destructive/10 border-destructive/30',
  emergency_loan: 'text-warning bg-warning/10 border-warning/30',
  disaster_relief: 'text-destructive bg-destructive/10 border-destructive/30',
};

const statusIcons = {
  pending: Clock,
  completed: CheckCircle2,
  expired: AlertCircle,
  failed: AlertCircle,
};


export const TransactionItem = forwardRef<HTMLDivElement, TransactionItemProps & { observerEntity?: string }>(
  ({ transaction, index, observerEntity }, ref) => {
    const Icon = typeIcons[transaction.type as keyof typeof typeIcons] || History;
    const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || Clock;

    const matchesEntity = (entity: string, target: string) => {
      if (!entity || !target) return false;
      const e = entity.toLowerCase().trim();
      const t = target.toLowerCase().trim();
      return e === t || (e.includes('government') && t.includes('government'));
    };

    const isIncoming = observerEntity
      ? matchesEntity(transaction.toEntity, observerEntity)
      : matchesEntity(transaction.toEntity, 'Government');

    const isOutgoing = observerEntity
      ? matchesEntity(transaction.fromEntity, observerEntity)
      : matchesEntity(transaction.fromEntity, 'Government');

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="glass-panel p-4 flex items-center gap-4 group hover:bg-muted/50 transition-all duration-300"
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center border',
          typeColors[transaction.type]
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {transaction.description}
            </p>
            <StatusIcon className={cn(
              'w-4 h-4 flex-shrink-0',
              transaction.status === 'completed' ? 'text-success' :
                transaction.status === 'pending' ? 'text-warning' : 'text-destructive'
            )} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{transaction.fromEntity}</span>
            <ArrowUpRight className="w-3 h-3" />
            <span>{transaction.toEntity}</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {transaction.amount > 0 && (
            <p className={cn(
              "font-semibold",
              isIncoming ? "text-success" : (isOutgoing ? "text-destructive" : "text-earth-gold")
            )}>
              {isIncoming ? '+' : (isOutgoing ? '-' : '')}₹{transaction.amount.toLocaleString('en-IN')}
            </p>
          )}
          {transaction.ccAmount && (
            <p className="text-sm text-primary font-medium">
              {transaction.ccAmount} CC
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {(() => {
              try {
                const date = new Date(transaction.timestamp);
                if (isNaN(date.getTime())) return 'Recent';
                return formatDistanceToNow(date, { addSuffix: true });
              } catch (e) {
                return 'Recent';
              }
            })()}
          </p>
        </div>
      </motion.div>
    );
  }
);

TransactionItem.displayName = 'TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  maxItems?: number;
  className?: string;
  observerEntity?: string;
}

export const TransactionList = ({
  transactions,
  maxItems = 10,
  className,
  hideGeneration = true,
  observerEntity
}: TransactionListProps & { hideGeneration?: boolean }) => {
  const filtered = hideGeneration
    ? transactions.filter(t => t.type !== 'cc_generation')
    : transactions;

  const displayedTransactions = filtered.slice(0, maxItems);

  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence mode="popLayout">
        {displayedTransactions.map((transaction, index) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            index={index}
            observerEntity={observerEntity}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

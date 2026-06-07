import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'gold';
  delay?: number;
  breakdown?: { label: string; value: string | number }[];
}

const variants = {
  default: 'bg-card/60 border-border/50',
  primary: 'bg-primary/10 border-primary/30',
  secondary: 'bg-secondary/10 border-secondary/30',
  gold: 'bg-earth-gold/10 border-earth-gold/30',
};

const iconVariants = {
  default: 'text-muted-foreground bg-muted/50',
  primary: 'text-primary bg-primary/20',
  secondary: 'text-secondary bg-secondary/20',
  gold: 'text-earth-gold bg-earth-gold/20',
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  delay = 0,
  breakdown,
}: StatCardProps) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        'glass-card p-6 cursor-pointer transition-all duration-300 w-full text-left',
        'hover:shadow-lg',
        variants[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2, type: 'spring' }}
            className="text-3xl font-bold font-display text-foreground"
          >
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend.isPositive
                ? 'text-success bg-success/10'
                : 'text-destructive bg-destructive/10'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          iconVariants[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );

  if (breakdown && breakdown.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {content}
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-card/90 backdrop-blur-md border-border/50 p-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
              Breakdown for {title}
            </h4>
            <div className="space-y-2">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return content;
};

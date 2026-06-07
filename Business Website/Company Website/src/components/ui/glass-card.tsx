import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  hover?: boolean;
  glow?: 'primary' | 'accent' | 'gold' | 'none';
  delay?: number;
}

export const GlassCard = ({
  children,
  className,
  hover = true,
  glow = 'none',
  delay = 0,
  ...props
}: GlassCardProps) => {
  const glowClasses = {
    primary: 'hover:shadow-[0_0_40px_hsl(var(--primary)/0.2)]',
    accent: 'hover:shadow-[0_0_40px_hsl(var(--accent)/0.2)]',
    gold: 'hover:shadow-[0_0_40px_hsl(var(--earth-gold)/0.2)]',
    none: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      className={cn(
        'glass-card p-6 transition-all duration-300',
        glowClasses[glow],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

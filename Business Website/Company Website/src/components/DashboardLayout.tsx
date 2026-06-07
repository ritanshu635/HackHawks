import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { motion } from 'framer-motion';
import { useCarbonStore } from '@/store/carbonStore';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { fetchInitialData } = useCarbonStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <TopNav />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6 min-h-[calc(100vh-4rem)] pb-24"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

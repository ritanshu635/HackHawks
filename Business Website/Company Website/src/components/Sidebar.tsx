import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCarbonStore } from '@/store/carbonStore';
import {
  LayoutDashboard,
  Users,
  Building2,
  Leaf,
  ArrowLeftRight,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wheat,
  Wallet,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

const governmentLinks = [
  { to: '/government', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/government/farmers', icon: Users, label: 'Farmers' },
  { to: '/government/companies', icon: Building2, label: 'Companies' },
  { to: '/government/credits', icon: Leaf, label: 'Carbon Credits' },
  { to: '/government/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/government/analytics', icon: TrendingUp, label: 'Analytics' },
];

const farmerLinks = [
  { to: '/farmer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farmer/crops', icon: Wheat, label: 'Crop Management' },
  { to: '/farmer/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/farmer/documents', icon: FileText, label: 'Documents' },
  { to: '/farmer/emergency', icon: AlertTriangle, label: 'Emergency Loan' },
];

const companyLinks = [
  { to: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company/credits', icon: Leaf, label: 'Carbon Credits' },
  { to: '/company/compliance', icon: FileText, label: 'Compliance' },
  { to: '/company/transactions', icon: ArrowLeftRight, label: 'Transactions' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, currentUserId, setRole } = useCarbonStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = currentRole === 'government'
    ? governmentLinks
    : currentRole === 'farmer'
      ? farmerLinks
      : companyLinks;

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar backdrop-blur-xl border-r border-sidebar-border z-40 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="font-display font-bold text-lg text-foreground">CarbonGov</h1>
                <p className="text-xs text-muted-foreground capitalize">{currentRole} Portal</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
          {links.map((link, index) => {
            const isActive = location.pathname === link.to;
            return (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <link.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'animate-pulse-glow')} />
                  {!isCollapsed && (
                    <span className="font-medium">{link.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-sidebar-primary-foreground"
                    />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>


        {/* Collapse Toggle */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const { logout } = useCarbonStore.getState();
              logout();
              navigate('/auth');
            }}
            className={cn(
              'w-full text-destructive hover:bg-destructive/10 hover:text-destructive',
              isCollapsed ? 'justify-center' : 'justify-start px-4'
            )}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};

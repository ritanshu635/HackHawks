import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, Settings, ChevronDown } from 'lucide-react';
import { useCarbonStore } from '@/store/carbonStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const TopNav = () => {
  const navigate = useNavigate();
  const { currentRole, currentUser, farmers, companies, transactions, setRole, logout } = useCarbonStore();
  const recentNotifications = transactions.slice(0, 3);

  const userName = currentUser?.name || (currentRole === 'farmer' && farmers[0]
    ? farmers[0].name
    : currentRole === 'company' && companies[0]
      ? companies[0].name
      : 'Admin');

  const roleLabels = {
    government: 'Government Super Admin',
    farmer: 'Farmer Portal',
    company: 'Company Portal',
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-card/40 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-30"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions, farmers, companies..."
            className="w-80 pl-10 bg-muted/30 border-border/50 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {recentNotifications.length}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover/95 backdrop-blur-xl border-border/50">
            <DropdownMenuLabel>Recent Activity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentNotifications.map((tx) => (
              <DropdownMenuItem key={tx.id} className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium text-sm">{tx.description}</span>
                <span className="text-xs text-muted-foreground">
                  {tx.fromEntity} → {tx.toEntity}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentRole}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl border-border/50">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              logout();
              navigate('/auth');
            }} className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

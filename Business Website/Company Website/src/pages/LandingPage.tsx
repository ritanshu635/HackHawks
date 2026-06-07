import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, Users, Building2, ArrowRight, TrendingUp, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCarbonStore } from '@/store/carbonStore';
import { GlassCard } from '@/components/ui/glass-card';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { setRole, governmentStats } = useCarbonStore();

  const handleRoleSelect = (role: 'government' | 'farmer' | 'company') => {
    setRole(role);
    if (role === 'government') {
      navigate('/dashboard');
    } else if (role === 'farmer') {
      navigate('/farmer/dashboard');
    } else {
      navigate('/company/dashboard');
    }
  };

  const stats = [
    { value: '1,570+', label: 'Carbon Credits Generated', icon: Leaf },
    { value: '₹55.6L', label: 'Revenue Generated', icon: TrendingUp },
    { value: '3', label: 'Active Farmers', icon: Users },
    { value: '3', label: 'Partner Companies', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl">CarbonGov</h1>
            <p className="text-xs text-muted-foreground">Carbon Credit Platform</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Button variant="ghost" className="text-muted-foreground">About</Button>
          <Button variant="ghost" className="text-muted-foreground">Documentation</Button>
          <Button variant="outline" className="border-primary/50 text-primary">
            Contact
          </Button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 mb-8">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm">Government of India Initiative</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              <span className="text-gradient">Carbon Credit</span>
              <br />
              Management Platform
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              A centralized government platform connecting farmers, carbon credits, and 
              industries for a sustainable future. Transparent, secure, and efficient.
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {/* Farmer Card */}
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="cursor-pointer"
              onClick={() => handleRoleSelect('farmer')}
            >
              <GlassCard className="h-full text-center group" glow="primary">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Farmer Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Register, manage crops, and track your carbon credit generation
                </p>
                <Button className="w-full group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                  Enter as Farmer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </GlassCard>
            </motion.div>

            {/* Government Card */}
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="cursor-pointer"
              onClick={() => handleRoleSelect('government')}
            >
              <GlassCard className="h-full text-center group border-primary/50" glow="gold">
                <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                  <Shield className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Government Admin</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Central control for CC aggregation, allocation, and payments
                </p>
                <Button className="w-full gradient-gold text-accent-foreground">
                  Enter as Admin <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </GlassCard>
            </motion.div>

            {/* Company Card */}
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="cursor-pointer"
              onClick={() => handleRoleSelect('company')}
            >
              <GlassCard className="h-full text-center group" glow="accent">
                <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                  <Building2 className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Company Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Purchase carbon credits for compliance and sustainability
                </p>
                <Button className="w-full group-hover:gradient-accent group-hover:text-accent-foreground transition-all">
                  Enter as Company <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-32"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">Platform Statistics</h2>
            <p className="text-muted-foreground">Real-time data from the carbon credit ecosystem</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <GlassCard className="text-center">
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-display font-bold text-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-32 text-center"
        >
          <h2 className="text-3xl font-display font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            A streamlined process ensuring transparency and fair compensation
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard delay={0.7}>
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Farmers Generate CC</h3>
              <p className="text-sm text-muted-foreground">
                Based on crop type and land size, carbon credits are automatically calculated monthly
              </p>
            </GlassCard>

            <GlassCard delay={0.8}>
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-bold text-accent-foreground">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Government Aggregates</h3>
              <p className="text-sm text-muted-foreground">
                All CC flows to the central government pool, creating a unified marketplace
              </p>
            </GlassCard>

            <GlassCard delay={0.9}>
              <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-bold text-accent-foreground">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Companies Purchase</h3>
              <p className="text-sm text-muted-foreground">
                Industries buy CC for compliance. Farmers receive guaranteed annual payments
              </p>
            </GlassCard>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              © 2024 CarbonGov. Government of India
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GovernmentDashboard } from './pages/GovernmentDashboard';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AuthPage } from './pages/AuthPage';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCarbonStore } from './store/carbonStore';
import { SolanaWalletProvider } from './components/SolanaWalletProvider';
import { Web3Provider } from './contexts/Web3Context';

// Simple component to handle redirect logic
const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { currentRole } = useCarbonStore();

  useEffect(() => {
    if (currentRole === 'government') {
      navigate('/government');
    } else if (currentRole === 'company') {
      navigate('/company/dashboard');
    } else {
      navigate('/farmer/dashboard');
    }
  }, [currentRole, navigate]);

  return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse">Syncing Dashboard...</div>;
};

function App() {
  return (
    <SolanaWalletProvider>
      <Web3Provider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Landing & Auth */}
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/landing" element={<Navigate to="/auth" replace />} />

              {/* Dynamic Redirector */}
              <Route path="/dashboard" element={<DashboardRedirect />} />

              {/* Dashboards */}
              <Route path="/government/*" element={<GovernmentDashboard />} />
              <Route path="/farmer/*" element={<FarmerDashboard />} />
              <Route path="/company/*" element={<CompanyDashboard />} />

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </Web3Provider>
    </SolanaWalletProvider>
  );
}

export default App;

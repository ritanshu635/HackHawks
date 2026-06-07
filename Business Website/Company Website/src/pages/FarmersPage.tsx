import { motion } from 'framer-motion';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Leaf,
  Wallet,
  MapPin,
  Eye,
  FileText,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CROP_CC_PER_ACRE, CC_PRICE } from '@/types/carbon';

export const FarmersPage = () => {
  const { farmers, verifyFarmer } = useCarbonStore();

  const DocumentReview = ({ farmer }: { farmer: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-4 gap-2 border-primary/30 hover:bg-primary/5 text-primary">
          <Eye className="w-3.5 h-3.5" /> View Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Farmer Verification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Submitted Files</p>
            <div className="space-y-3">
              {[
                { label: 'Aadhaar Card', file: farmer.aadhaar_doc },
                { label: 'Land Record', file: farmer.land_doc },
                { label: 'Bank Details', file: farmer.bank_doc }
              ].map(doc => (
                <div key={doc.label} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm">{doc.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{doc.file || 'Not Uploaded'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <p className="text-xs leading-relaxed">
              Ensure documents match official records before approving.
            </p>
          </div>

          <Button
            className="w-full h-11 gradient-primary font-bold"
            onClick={() => verifyFarmer(farmer.id)}
            disabled={farmer.status === 'verified'}
          >
            {farmer.status === 'verified' ? (
              <><Check className="w-4 h-4 mr-2" /> Already Verified</>
            ) : (
              <><Check className="w-4 h-4 mr-2" /> Approve Verification</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
              Registered Farmers
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage farmer profiles and CC generation
            </p>
          </div>
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Farmer
          </Button>
        </motion.div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers by name or land ID..."
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>

        {/* Farmers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers.map((farmer, index) => {
            const yearlyCC = farmer.landSize * CROP_CC_PER_ACRE[farmer.currentCrop];
            const yearlyPayment = yearlyCC * CC_PRICE;

            return (
              <motion.div
                key={farmer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover glow="primary" className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{farmer.name}</h3>
                        <p className="text-xs text-muted-foreground">{farmer.aadhaar}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={farmer.status === 'verified' ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}>
                        {farmer.status.toUpperCase()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>View Transactions</DropdownMenuItem>
                          <DropdownMenuItem>Process Payment</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{farmer.landId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
                        {farmer.currentCrop}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {farmer.landSize} acres
                      </span>
                    </div>

                    <div className="glass-panel p-3 grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Leaf className="w-3 h-3" />
                          <span>Total CC</span>
                        </div>
                        <p className="font-bold text-primary">{farmer.totalCCGenerated}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Wallet className="w-3 h-3" />
                          <span>Wallet</span>
                        </div>
                        <p className="font-bold text-earth-gold">
                          ₹{(farmer.walletBalance / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Payment</span>
                        <span className="font-semibold text-earth-gold">
                          ₹{(yearlyPayment / 100000).toFixed(1)}L/yr
                        </span>
                      </div>
                    </div>
                  </div>

                  <DocumentReview farmer={farmer} />
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

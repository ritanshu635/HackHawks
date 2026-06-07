import { motion } from 'framer-motion';
import { useCarbonStore } from '@/store/carbonStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Leaf,
  CheckCircle2,
  Clock,
  AlertCircle,
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
import { CC_PRICE } from '@/types/carbon';
import { Progress } from '@/components/ui/progress';

export const CompaniesPage = () => {
  const { companies, verifyCompany, allocateCC, governmentStats } = useCarbonStore();

  const CompanyDocumentReview = ({ company }: { company: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-4 gap-2 border-earth-gold/30 hover:bg-earth-gold/5 text-earth-gold font-bold">
          <Eye className="w-3.5 h-3.5" /> View Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-earth-gold" />
            Company Verification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Submitted Documents</p>
            <div className="p-2 rounded-lg bg-background/50 border border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-earth-gold" />
                <span className="text-sm">Registration Certificate (CIN/GST)</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{company.registration_doc || 'manual_entry.pdf'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-earth-gold/10 rounded-xl border border-earth-gold/20">
            <ShieldCheck className="w-5 h-5 text-earth-gold" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Verify registration for <span className="text-foreground font-bold">{company.name}</span> matches MCA records.
            </p>
          </div>

          <Button
            className="w-full h-11 bg-earth-gold text-white hover:bg-earth-gold/90 font-bold"
            onClick={() => verifyCompany(company.id)}
            disabled={company.status === 'verified'}
          >
            {company.status === 'verified' ? (
              <><Check className="w-4 h-4 mr-2" /> Already Verified</>
            ) : (
              <><Check className="w-4 h-4 mr-2" /> Approve Company</>
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
              Registered Companies
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage company registrations and CC allocation
            </p>
          </div>
          <div className="flex gap-2">
            <div className="glass-panel px-4 py-2 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm">Available CC: <strong className="text-primary">{governmentStats.ccWalletBalance}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, index) => {
            const usagePercentage = company.allocatedCC > 0
              ? Math.round((company.usedCC / company.allocatedCC) * 100)
              : 0;
            const totalPayment = company.allocatedCC * CC_PRICE;

            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover glow="accent" className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <p className="text-xs text-muted-foreground">{company.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className={company.status === 'verified'
                          ? 'bg-success/20 text-success border-success/30'
                          : 'bg-warning/20 text-warning border-warning/30'
                        }
                      >
                        {company.status === 'verified' ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
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
                          {company.status !== 'verified' && (
                            <DropdownMenuItem onClick={() => verifyCompany(company.id)}>
                              Approve Company
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => allocateCC(company.id, 50, 1)}>
                            Allocate 50 CC
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Req: {company.requiredCC} CC
                      </span>
                    </div>

                    {/* CC Usage */}
                    <div className="glass-panel p-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">CC Usage</span>
                        <span>{company.usedCC} / {company.allocatedCC}</span>
                      </div>
                      <Progress value={usagePercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="glass-panel p-2">
                        <Leaf className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-sm font-bold">{company.allocatedCC}</p>
                        <p className="text-xs text-muted-foreground">Allocated</p>
                      </div>
                      <div className="glass-panel p-2">
                        <CheckCircle2 className="w-4 h-4 text-success mx-auto mb-1" />
                        <p className="text-sm font-bold">{company.usedCC}</p>
                        <p className="text-xs text-muted-foreground">Used</p>
                      </div>
                      <div className="glass-panel p-2">
                        <AlertCircle className="w-4 h-4 text-warning mx-auto mb-1" />
                        <p className="text-sm font-bold">{company.allocatedCC - company.usedCC}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Payment</span>
                        <span className="font-semibold text-earth-gold">
                          ₹{(totalPayment / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>
                  </div>

                  <CompanyDocumentReview company={company} />
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

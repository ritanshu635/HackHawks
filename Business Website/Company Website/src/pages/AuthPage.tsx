import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCarbonStore } from '@/store/carbonStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Building2, User, ArrowLeft, ShieldCheck, ShieldAlert, FileUp, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

type AuthView = 'selection' | 'farmer' | 'company' | 'login' | 'government';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { login, signup, isLoading, error } = useCarbonStore();
  const [view, setView] = useState<AuthView>('selection');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'farmer' | 'company'>('farmer');

  // Signup State
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    aadhaar: '',
    landSize: '',
    landId: '',
    bankDetails: '',
    currentCrop: '',
    sowingYear: '',
    registrationNumber: '',
    requiredCC: '',
    complianceYear: '',
    aadhaar_doc: '',
    land_doc: '',
    bank_doc: '',
    registration_doc: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = view === 'government' ? 'government' : loginRole;
    try {
      await login({ email: loginEmail, password: loginPassword, role });

      // Navigate based on whatever the store now has as currentRole
      const state = useCarbonStore.getState();
      if (state.currentRole === 'government') navigate('/government');
      else if (state.currentRole === 'company') navigate('/company/dashboard');
      else navigate('/farmer/dashboard');
    } catch (err) {
      console.error('Login Failed:', err);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = view === 'farmer' ? 'farmer' : 'company';
    try {
      await signup({
        ...signupData,
        role,
        landSize: Number(signupData.landSize) || 0,
        requiredCC: Number(signupData.requiredCC) || 0,
        sowingYear: Number(signupData.sowingYear) || new Date().getFullYear(),
        complianceYear: Number(signupData.complianceYear) || new Date().getFullYear(),
        // Simulated document uploads
        aadhaar_doc: signupData.aadhaar_doc || (view === 'farmer' ? `${signupData.name.split(' ')[0]}_aadhaar.pdf` : ''),
        land_doc: signupData.land_doc || (view === 'farmer' ? `${signupData.name.split(' ')[0]}_land.pdf` : ''),
        bank_doc: signupData.bank_doc || (view === 'farmer' ? `${signupData.name.split(' ')[0]}_bank.pdf` : ''),
        registration_doc: signupData.registration_doc || (view === 'company' ? `${signupData.name.split(' ')[0]}_reg.pdf` : ''),
      });
      if (role === 'farmer') navigate('/farmer/dashboard');
      else navigate('/company/dashboard');
    } catch (err: any) { 
      console.error('Signup error:', err);
      // The error will be displayed by the store's error state
    }
  };

  const backToSelection = () => setView('selection');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden font-display text-foreground">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-earth-gold/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        layout
        className="w-full max-w-xl relative z-10"
      >
        <AnimatePresence mode="wait">
          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8 text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Leaf className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Carbon Bloom Connect</h1>
                <p className="text-muted-foreground text-lg">Join India's premium carbon aggregation network</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard
                  className="p-8 cursor-pointer hover:border-primary/50 transition-all group"
                  onClick={() => setView('farmer')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Join as Farmer</h2>
                  <p className="text-sm text-muted-foreground">Register land and start earning carbon credits.</p>
                  <Button className="w-full mt-6 variant-outline group-hover:bg-primary group-hover:text-white">Get Started</Button>
                </GlassCard>

                <GlassCard
                  className="p-8 cursor-pointer hover:border-earth-gold/50 transition-all group"
                  onClick={() => setView('company')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-earth-gold/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Building2 className="w-7 h-7 text-earth-gold" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Join as Company</h2>
                  <p className="text-sm text-muted-foreground">Purchase verified credits for compliance goals.</p>
                  <Button className="w-full mt-6 variant-outline group-hover:bg-earth-gold group-hover:text-white">Join Platform</Button>
                </GlassCard>
              </div>

              <div className="flex flex-col items-center gap-6 pt-6 border-t border-border/50">
                <Button variant="ghost" onClick={() => setView('login')} className="text-muted-foreground hover:text-primary">
                  Already have an account? Login
                </Button>

                {/* Instructions */}
                <div className="w-full p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h3 className="text-sm font-bold mb-2 text-center text-blue-500">How to Get Started</h3>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>1. <strong>Sign up</strong> as a Company or Farmer with your real details</div>
                    <div>2. <strong>Connect MetaMask</strong> to Sepolia testnet for blockchain transactions</div>
                    <div>3. <strong>Request carbon credits</strong> and pay with ETH on Sepolia</div>
                    <div>4. <strong>View transactions</strong> on Etherscan for verification</div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">Administrative Access</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setView('government')}
                    className="text-xs border-primary/20 hover:bg-primary/5 text-primary/60 hover:text-primary"
                  >
                    <ShieldCheck className="w-3 h-3 mr-2" />
                    Government Official Login
                  </Button>
                  <p className="text-[8px] text-muted-foreground/70">Use: admin / admin123</p>
                </div>
              </div>
            </motion.div>
          )}

          {(view === 'farmer' || view === 'company') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel p-8"
            >
              <Button variant="ghost" onClick={backToSelection} className="mb-6 -ml-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h2 className="text-2xl font-bold mb-2">Register as {view === 'farmer' ? 'Farmer' : 'Company'}</h2>
              <p className="text-muted-foreground mb-8 text-sm">Create your secure carbon monitoring account</p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm mb-6">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>{view === 'farmer' ? 'Full Name' : 'Company Name'}</Label>
                    <Input required value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" required value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input required value={signupData.mobile} onChange={e => setSignupData({ ...signupData, mobile: e.target.value })} autoComplete="off" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secure Password</Label>
                  <Input type="password" required value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} autoComplete="off" />
                </div>

                {view === 'farmer' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Land Size (Acres)</Label>
                        <Input type="number" required value={signupData.landSize} onChange={e => setSignupData({ ...signupData, landSize: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sowing Year</Label>
                        <Input type="number" required value={signupData.sowingYear} onChange={e => setSignupData({ ...signupData, sowingYear: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Verification Documents</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { label: 'Aadhaar Card', field: 'aadhaar_doc', idField: 'aadhaar', idLabel: 'Aadhaar Number' },
                            { label: 'Land Record (7/12)', field: 'land_doc', idField: 'landId', idLabel: 'Land ID' },
                            { label: 'Bank Passbook', field: 'bank_doc', idField: 'bankDetails', idLabel: 'Account Number' }
                          ].map(doc => (
                            <div key={doc.field} className="group relative">
                              <div className="flex flex-col gap-2 p-3 rounded-xl border-border/50 border bg-muted/20 transition-all hover:border-primary/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold">{doc.label}</span>
                                  {signupData[doc.field] ? (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  ) : (
                                    <FileUp className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder={doc.idLabel}
                                    className="h-8 text-xs bg-background/50"
                                    required
                                    value={signupData[doc.idField]}
                                    onChange={e => setSignupData({ ...signupData, [doc.idField]: e.target.value })}
                                  />
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-[10px] whitespace-nowrap"
                                    onClick={() => setSignupData({ ...signupData, [doc.field]: `${signupData.name.split(' ')[0]}_${doc.field}.pdf` })}
                                  >
                                    {signupData[doc.field] ? 'Uploaded' : 'Upload'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Required CC (Annual)</Label>
                        <Input type="number" required value={signupData.requiredCC} onChange={e => setSignupData({ ...signupData, requiredCC: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Year</Label>
                        <Input type="number" value={signupData.complianceYear} onChange={e => setSignupData({ ...signupData, complianceYear: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Company Documentation</Label>
                      <div className="flex flex-col gap-3 p-4 rounded-xl border-border/50 border bg-muted/20 transition-all hover:border-earth-gold/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Registration Certificate (CIN/GST)</span>
                          {signupData.registration_doc ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <FileUp className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="CIN Number"
                            className="h-8 text-xs bg-background/50"
                            required
                            value={signupData.registrationNumber}
                            onChange={e => setSignupData({ ...signupData, registrationNumber: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 text-[10px]"
                            onClick={() => setSignupData({ ...signupData, registration_doc: `${signupData.name.split(' ')[0]}_reg.pdf` })}
                          >
                            {signupData.registration_doc ? 'Uploaded' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full h-12 gradient-primary text-lg font-bold mt-4" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Complete Registration'}
                </Button>
              </form>
            </motion.div>
          )}

          {(view === 'login' || view === 'government') && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-8 text-center"
            >
              <Button variant="ghost" onClick={backToSelection} className="mb-6 -ml-2 text-muted-foreground mr-auto flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {view === 'government' ? <ShieldCheck className="w-8 h-8 text-primary" /> : <User className="w-8 h-8 text-primary" />}
              </div>
              <h2 className="text-2xl font-bold mb-2">{view === 'government' ? 'Government Access' : 'Login to Account'}</h2>
              <p className="text-muted-foreground mb-8 text-sm">Enter your secure credentials</p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm mb-6 text-left">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left" autoComplete="off">
                {view !== 'government' && (
                  <div className="flex bg-muted/50 p-1 rounded-lg mb-4">
                    <button
                      type="button"
                      onClick={() => setLoginRole('farmer')}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${loginRole === 'farmer' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}
                    >
                      Farmer
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRole('company')}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${loginRole === 'company' ? 'bg-earth-gold text-white shadow-sm' : 'text-muted-foreground'}`}
                    >
                      Company
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{view === 'government' ? 'Admin Username' : 'Email, Mobile, or Name'}</Label>
                  {/* Honeypot field to absorb autofill */}
                  <input type="text" name="cb_honeypot_user" className="hidden" tabIndex={-1} autoComplete="off" />
                  <Input
                    placeholder="Enter Username"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <input type="password" name="cb_honeypot_pass" className="hidden" tabIndex={-1} autoComplete="off" />
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                  />
                </div>
                <Button type="submit" className="w-full h-12 gradient-primary mt-4" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Login'}
                </Button>
              </form>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

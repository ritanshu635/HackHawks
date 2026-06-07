import { create } from 'zustand';
import { api, farmerService, companyService, governmentService } from '@/services/api';
import { Farmer, Company, GovernmentStats, Transaction, MonthlyData, CropType, CCArchive } from '@/types/carbon';

interface CarbonState {
  currentRole: 'farmer' | 'company' | 'government';
  currentUserId: string | null;
  farmers: Farmer[];
  companies: Company[];
  governmentStats: GovernmentStats;
  transactions: Transaction[];
  monthlyData: MonthlyData[];
  isLoading: boolean;
  error: string | null;
  currentUser: any | null;
  ccArchives: CCArchive[];

  // Actions
  setRole: (role: 'farmer' | 'company' | 'government', userId?: string) => void;
  fetchInitialData: () => Promise<void>;
  updateCrop: (farmerId: string, crop: CropType) => Promise<void>;
  logMonth: (farmerId: string, log: any) => Promise<void>;

  // Auth Actions
  login: (credentials: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;

  // New Orchestration Actions
  verifyFarmer: (id: string) => Promise<void>;
  verifyCompany: (id: string) => Promise<void>;
  allocateCC: (companyId: string, ccAmount: number, years: number, transactionHash?: string) => Promise<void>;
  stimulatePayment: (month: number) => Promise<void>;
  buyCC: (companyId: string, amount: number, ccAmount: number) => Promise<void>;
  raiseDisasterRelief: (farmerId: string, description: string) => Promise<void>;
  approveDisasterRelief: (farmerId: string, amount: number) => Promise<void>;
  processFarmerPayout: (farmerId: string) => Promise<void>;
}

export const useCarbonStore = create<CarbonState>((set, get) => ({
  currentRole: 'government',
  currentUserId: 'admin',
  farmers: [],
  companies: [],
  governmentStats: {
    ccWalletBalance: 0,
    totalCCGenerated: 0,
    walletBalance: 0,
    totalFarmersPaid: 0,
    totalFarmers: 0,
    totalCompanies: 0,
  } as any,
  transactions: [],
  ccArchives: [],
  currentUser: null,
  monthlyData: [
    { month: 'Jan', ccGenerated: 450, ccAllocated: 380 },
    { month: 'Feb', ccGenerated: 520, ccAllocated: 410 },
    { month: 'Mar', ccGenerated: 480, ccAllocated: 450 },
    { month: 'Apr', ccGenerated: 610, ccAllocated: 500 },
    { month: 'May', ccGenerated: 590, ccAllocated: 520 },
    { month: 'Jun', ccGenerated: 650, ccAllocated: 580 },
  ],
  isLoading: false,
  error: null,

  setRole: (role, userId) => {
    // RESET state on role change
    set({
      currentRole: role,
      currentUserId: userId,
      farmers: [],
      companies: [],
      error: null
    });
    get().fetchInitialData();
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', credentials);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({
        currentRole: user.role,
        currentUserId: user.id,
        currentUser: user,
        farmers: [],
        companies: [],
        error: null
      });
      await get().fetchInitialData();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/signup', data);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({
        currentRole: user.role,
        currentUserId: user.id,
        currentUser: user,
        farmers: [],
        companies: [],
        error: null
      });
      await get().fetchInitialData();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Signup failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentRole: 'farmer', currentUserId: null, currentUser: null, farmers: [], companies: [] });
  },

  verifyFarmer: async (id) => {
    try {
      await api.patch(`/government/verify-farmer/${id}`);
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },

  verifyCompany: async (id) => {
    try {
      await api.patch(`/government/verify-company/${id}`);
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },

  allocateCC: async (companyId, ccAmount, years, transactionHash) => {
    try {
      await api.post('/government/allocate-cc', { companyId, ccAmount, years, transactionHash });
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.response?.data?.error || err.message }); }
  },

  stimulatePayment: async (month) => {
    try {
      await api.post('/government/stimulate-payment', { month });
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },

  buyCC: async (companyId, amount, ccAmount) => {
    try {
      await api.post(`/companies/${companyId}/pay`, { amount, ccAmount });
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },

  raiseDisasterRelief: async (farmerId, description) => {
    try {
      await api.post(`/farmers/${farmerId}/disaster-relief`, { description });
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },

  approveDisasterRelief: async (farmerId, amount) => {
    try {
      await api.post(`/government/approve-disaster/${farmerId}`, { amount });
      await get().fetchInitialData();
    } catch (err: any) {
      const msg = err.message || "Failed to approve claim";
      set({ error: msg });
      alert(msg);
    }
  },

  processFarmerPayout: async (farmerId) => {
    try {
      await api.post(`/government/payout/${farmerId}`);
      await get().fetchInitialData();
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message });
      throw err;
    }
  },

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    const { currentRole, currentUserId } = get();

    try {
      if (currentRole === 'government') {
        const [statsRes, txsRes, farmersRes, companiesRes] = await Promise.all([
          governmentService.getStats(),
          governmentService.getTransactions(),
          governmentService.getFarmers(),
          governmentService.getCompanies(),
        ]);

        const statsData = statsRes.data.data;
        set({
          governmentStats: {
            ...statsData,
            ccWalletBalance: statsData.cc_balance,
            walletBalance: statsData.money_balance,
            totalCCGenerated: statsData.total_cc_generated,
            totalFarmersPaid: statsData.total_farmers_paid
          },
          transactions: (txsRes.data.data || []).map((t: any) => ({
            ...t,
            fromEntity: t.from_entity,
            toEntity: t.to_entity,
            ccAmount: t.cc_amount
          })),
          farmers: (farmersRes.data.data || []).map((f: any) => ({
            ...f,
            landId: f.land_id,
            landSize: f.land_size,
            totalCCGenerated: f.total_cc_generated,
            currentCrop: f.current_crop,
            disasterStatus: f.disaster_status,
            disasterDescription: f.disaster_description,
            decemberLogged: f.december_logged,
            walletBalance: f.wallet_balance,
            insuranceFund: f.insurance_fund || 0
          })),
          companies: (companiesRes.data.data || []).map((c: any) => ({
            ...c,
            requiredCC: c.required_cc,
            allocatedCC: c.allocated_cc,
            usedCC: c.used_cc || 0,
            registrationNumber: c.registration_number,
            paymentStatus: c.payment_status || 'unpaid',
            requestStatus: c.request_status || 'none',
            walletBalance: c.wallet_balance || 0,
            complianceYear: c.compliance_year || 2026
          })),
        });
      } else if (currentRole === 'farmer') {
        const id = currentUserId;
        if (!id) return;
        const [farmerRes, historyRes, archivesRes] = await Promise.all([
          farmerService.getById(id).catch(() => ({ data: { data: null } })),
          farmerService.getHistory(id).catch(() => ({ data: { data: [] } })),
          api.get(`/farmers/${id}/archives`).catch(() => ({ data: { data: [] } }))
        ]);
        if (farmerRes.data.data) {
          const f = farmerRes.data.data;
          set({
            farmers: [{
              ...f,
              landId: f.land_id,
              landSize: f.land_size,
              totalCCGenerated: f.total_cc_generated,
              currentCrop: f.current_crop,
              disasterStatus: f.disaster_status,
              disasterDescription: f.disaster_description,
              decemberLogged: f.december_logged,
              walletBalance: f.wallet_balance,
              insuranceFund: f.insurance_fund || 0,
              sowingYear: f.sowing_year
            }],
            transactions: (historyRes.data.data || []).map((t: any) => ({
              ...t,
              fromEntity: t.from_entity,
              toEntity: t.to_entity,
              ccAmount: t.cc_amount
            })),
            ccArchives: archivesRes.data.data || []
          });
        }
      } else if (currentRole === 'company') {
        const id = currentUserId;
        if (!id) return;
        const [companyRes, txsRes] = await Promise.all([
          companyService.getById(id).catch(() => ({ data: { data: null } })),
          api.get(`/transactions?entityId=${id}`).catch(() => ({ data: { data: [] } }))
        ]);
        if (companyRes.data.data) {
          const c = companyRes.data.data;
          set({
            companies: [{
              ...c,
              requiredCC: c.required_cc,
              allocatedCC: c.allocated_cc,
              usedCC: c.used_cc || 0,
              registrationNumber: c.registration_number,
              paymentStatus: c.payment_status || 'unpaid',
              requestStatus: c.request_status || 'none',
              walletBalance: c.wallet_balance || 0,
              complianceYear: c.compliance_year || 2026
            }],
            transactions: (txsRes.data.data || []).map((t: any) => ({
              ...t,
              fromEntity: t.from_entity,
              toEntity: t.to_entity,
              ccAmount: t.cc_amount
            }))
          });
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateCrop: async (farmerId, crop) => {
    try {
      await farmerService.updateCrop(farmerId, crop);
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },

  logMonth: async (farmerId, log) => {
    try {
      await api.post(`/farmers/${farmerId}/log-month`, log);
      await get().fetchInitialData();
    } catch (err: any) { set({ error: err.message }); }
  },
}));

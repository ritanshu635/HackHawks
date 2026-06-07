export type UserRole = 'government' | 'farmer' | 'company';

export type CropType = 'wheat' | 'cotton' | 'jowar' | 'mango' | 'teak';

export interface Farmer {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  password?: string;
  aadhaar: string;
  landSize: number;
  landId: string;
  bankDetails: string;
  walletBalance: number;
  wallet_balance: number; // Keep for backward compatibility if needed
  currentCrop: CropType | string;
  totalCCGenerated: number;
  status: 'pending' | 'verified';
  disasterStatus: 'none' | 'pending' | 'approved';
  disaster_status: 'none' | 'pending' | 'approved';
  disasterDescription: string;
  disaster_description: string;
  decemberLogged: boolean;
  december_logged: boolean;
  sowingYear: number;
  registeredAt: Date | string;
  insuranceFund: number;
  aadhaar_doc?: string;
  land_doc?: string;
  bank_doc?: string;
}

export interface CCArchive {
  id: string;
  farmer_id: string;
  year: number;
  crop_type: string;
  land_size: number;
  cc_produced: number;
  payout_amount: number;
  interest_amount: number;
  timestamp: string;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  registrationNumber: string;
  registration_number?: string; // Legacy
  requiredCC: number;
  allocatedCC: number;
  allocated_cc?: number; // Legacy
  paymentStatus: 'pending' | 'paid' | 'unpaid';
  payment_status?: string; // Legacy
  requestStatus: 'none' | 'requested' | 'allocated' | 'approved' | 'rejected';
  request_status?: string; // Legacy
  usedCC: number;
  used_cc?: number; // Legacy
  walletBalance: number;
  wallet_balance?: number; // Legacy
  status: 'pending' | 'verified';
  complianceYear: number;
  compliance_year?: number; // Legacy
  registeredAt: Date | string;
  registration_doc?: string;
}

export interface GovernmentStats {
  walletBalance: number;
  ccWalletBalance: number;
  totalCCGenerated: number;
  totalCCAllocated: number;
  totalFarmersPaid: number;
  totalFarmers: number;
  totalCompanies: number;
}

export interface Transaction {
  id: string;
  type: 'cc_generation' | 'cc_allocation' | 'cc_payment' | 'farmer_payment' | 'emergency_loan' | 'cc_usage';
  amount: number;
  ccAmount: number;
  fromEntity: string;
  toEntity: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  timestamp: string | Date;
}

export interface MonthlyData {
  month: string;
  ccGenerated: number;
  ccAllocated: number;
}

export interface CarbonState {
  // Auth State
  isAuthenticated: boolean;
  currentUser: any | null;
  currentRole: UserRole;
  currentUserId: string | null;

  // Data State
  farmers: Farmer[];
  companies: Company[];
  governmentStats: GovernmentStats;
  transactions: Transaction[];
  ccArchives: CCArchive[];
  monthlyData: MonthlyData[];
  isLoading: boolean;
  error: string | null;

  // Auth Actions
  login: (credentials: any) => Promise<any>;
  signup: (data: any) => Promise<any>;
  logout: () => void;
  setRole: (role: UserRole, userId?: string) => void;

  // Data Actions
  fetchInitialData: () => Promise<void>;
  updateCrop: (farmerId: string, crop: CropType) => Promise<void>;
  logMonth: (farmerId: string, data: { month: number, year: number, crop: string }) => Promise<void>;
  generateMonthlyCC: () => Promise<void>;
  createPaymentOrder: (companyId: string, ccAmount: number) => Promise<any>;
  verifyPayment: (data: any) => Promise<void>;
  approveCompany: (companyId: string) => Promise<void>;
  payFarmers: () => Promise<any>;
  processExpiry: () => Promise<any>;
}

export const CROP_CC_PER_ACRE: Record<CropType, number> = {
  wheat: 160, // 13.33 per month
  cotton: 180, // 15 per month
  jowar: 200, // 16.66 per month
  mango: 400, // 33.33 per month
  teak: 360, // 30 per month
};

export const CC_PRICE = 2000;

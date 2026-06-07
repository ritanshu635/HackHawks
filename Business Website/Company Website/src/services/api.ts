import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    console.error('API Error:', message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(new Error(message));
  }
);

export const farmerService = {
  register: (data: any) => api.post('/farmers/register', data),
  getDetails: (id: string) => api.get(`/farmers/${id}`),
  getById: (id: string) => api.get(`/farmers/${id}`), // Alias for getDetails
  getAll: () => api.get('/government/farmers'), // Secured endpoint (admin only)
  updateCrop: (id: string, crop: string) => api.put(`/farmers/${id}/crop`, { crop }),
  getHistory: (id: string) => api.get(`/farmers/${id}/history`),
  requestLoan: (id: string, amount: number) => api.post(`/farmers/${id}/emergency-loan`, { amount }),
  logMonth: (id: string, data: any) => api.post(`/farmers/${id}/log-month`, data),
};

export const companyService = {
  register: (data: any) => api.post('/companies/register', data),
  getDetails: (id: string) => api.get(`/companies/${id}`),
  getById: (id: string) => api.get(`/companies/${id}`), // Alias for getDetails
  getAll: () => api.get('/government/companies'), // Secured endpoint
  getAllocations: (id: string) => api.get(`/companies/${id}/allocations`),
  useCC: (id: string, ccAmount: number) => api.post(`/companies/${id}/use-cc`, { ccAmount }),
  getTransactions: (id: string) => api.get(`/transactions?entityId=${id}`), // Assuming generic transaction search
};

export const governmentService = {
  getStats: () => api.get('/government/stats'),
  getFarmers: () => api.get('/government/farmers'),
  getCompanies: () => api.get('/government/companies'),
  approveCompany: (id: string) => api.post(`/government/approve-company/${id}`),
  generateMonthlyCC: () => api.post('/government/generate-monthly-cc'),
  payFarmers: () => api.post('/government/pay-farmers'),
  processExpiry: () => api.post('/government/process-expiry'),
  getTransactions: () => api.get('/transactions'), // Global transactions
  getMonthlyData: () => Promise.resolve({ data: [] }), // Placeholder if backend endpoint missing
};

export const paymentService = {
  getKey: () => api.get('/payments/key'),
  createOrder: (companyId: string, ccAmount: number) => api.post('/payments/create-order', { companyId, ccAmount }),
  verifyPayment: (data: any) => api.post('/payments/verify', data),
};

export const transactionService = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
};

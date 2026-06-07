import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb } from './config/database.js';

// Import routes
import farmersRouter from './routes/farmers.js';
import companiesRouter from './routes/companies.js';
import governmentRouter from './routes/government.js';
import paymentsRouter from './routes/payments.js';
import transactionsRouter from './routes/transactions.js';
import authRoutes from './routes/auth.js';
import syncRouter from './routes/sync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: true, // Allow all origins (reflects request origin)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/government', governmentRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/sync', syncRouter);

// Blockchain routes (optional - only if blockchain is enabled)
if (process.env.ENABLE_BLOCKCHAIN === 'true') {
  try {
    const blockchainRouter = await import('./routes/blockchain.js');
    app.use('/api/blockchain', blockchainRouter.default);
    console.log('✅ Blockchain routes enabled');
  } catch (error) {
    console.warn('⚠️  Blockchain routes disabled:', error.message);
  }
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Initialize DB connection
    await getDb();
    console.log('✅ Database initialized successfully');

    // Initialize blockchain service (optional)
    if (process.env.ENABLE_BLOCKCHAIN === 'true') {
      try {
        const blockchainService = await import('./services/blockchainService.js');
        await blockchainService.default.initialize();
        console.log('✅ Blockchain service initialized');
        
        // Synchronize government balance on startup
        await blockchainService.default.synchronizeGovernmentBalance();
        console.log('✅ Government balance synchronized to 490,196 CC');
      } catch (error) {
        console.warn('⚠️  Blockchain initialization failed, running in local mode:', error.message);
      }
    } else {
      console.log('ℹ️  Blockchain features disabled (set ENABLE_BLOCKCHAIN=true to enable)');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      if (process.env.ENABLE_BLOCKCHAIN === 'true') {
        console.log(`🔗 Blockchain API: http://localhost:${PORT}/api/blockchain`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

startServer();

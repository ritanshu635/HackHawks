import express from 'express';
import axios from 'axios';

const router = express.Router();

// Green Ledger India API endpoint (assuming it runs on port 3001)
const GREEN_LEDGER_API = 'http://localhost:3001/api';

/**
 * Synchronize government balance across platforms
 * This endpoint is called after a successful carbon credit purchase
 */
router.post('/government-balance', async (req, res) => {
  try {
    const { ccAmount, transactionHash, companyId, platform = 'carbon-bloom-connect' } = req.body;

    console.log(`🔄 Synchronizing balance: ${ccAmount} CC deducted from government wallet`);
    console.log(`📊 Transaction: ${transactionHash}`);
    console.log(`🏢 Company: ${companyId}`);

    // Try to notify Green Ledger India about the balance change
    try {
      const syncResponse = await axios.post(`${GREEN_LEDGER_API}/sync/balance-update`, {
        ccAmount: -ccAmount, // Negative because it's a deduction
        source: platform,
        transactionHash,
        companyId,
        timestamp: new Date().toISOString()
      }, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Source': 'carbon-bloom-connect'
        }
      });

      console.log('✅ Green Ledger India notified successfully');
      
      res.json({
        success: true,
        message: 'Balance synchronized across platforms',
        greenLedgerResponse: syncResponse.data
      });
    } catch (syncError: any) {
      console.warn('⚠️ Failed to sync with Green Ledger India:', syncError.message);
      
      // Even if sync fails, we still return success for the main transaction
      res.json({
        success: true,
        message: 'Transaction completed, but cross-platform sync failed',
        syncError: syncError.message
      });
    }

  } catch (error: any) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current government balance for verification
 */
router.get('/government-balance', async (req, res) => {
  try {
    // This would typically fetch from blockchain or database
    res.json({
      success: true,
      balance: 490196, // Current balance
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
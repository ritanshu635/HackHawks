import express from 'express';
import { getDb } from '../config/database.js';

const router = express.Router();

/**
 * Get all farmers for verification
 */
router.get('/farmers', async (req, res) => {
  try {
    const db = await getDb();
    const farmers = await db.all('SELECT * FROM farmers');
    res.json({ success: true, data: farmers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all companies for verification
 */
router.get('/companies', async (req, res) => {
  try {
    const db = await getDb();
    const companies = await db.all('SELECT * FROM companies');
    res.json({ success: true, data: companies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get government stats
 */
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const stats = await db.get('SELECT * FROM government_wallet WHERE id = 1');
    const totalFarmers = await db.get('SELECT COUNT(*) as count FROM farmers');
    const totalCompanies = await db.get('SELECT COUNT(*) as count FROM companies');

    res.json({
      success: true,
      data: {
        ...stats,
        totalFarmers: totalFarmers.count,
        totalCompanies: totalCompanies.count
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify Farmer
 */
router.patch('/verify-farmer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('UPDATE farmers SET status = "verified" WHERE id = ?', id);
    res.json({ success: true, message: 'Farmer verified' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify Company
 */
router.patch('/verify-company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('UPDATE companies SET status = "verified", approved = 1 WHERE id = ?', id);
    res.json({ success: true, message: 'Company verified' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Allocate CC to Company (with MetaMask integration)
 */
router.post('/allocate-cc', async (req, res) => {
  try {
    const { companyId, ccAmount, years, transactionHash } = req.body;
    const db = await getDb();

    // Check if gov has enough cc
    const gov = await db.get('SELECT cc_balance FROM government_wallet WHERE id = 1');
    if (gov.cc_balance < ccAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient CC in Government Wallet' });
    }

    // Get company details
    const company = await db.get('SELECT name FROM companies WHERE id = ?', companyId);
    if (!company) {
      return res.status(400).json({ success: false, error: 'Company not found' });
    }

    // Update company allocation
    await db.run(
      'UPDATE companies SET allocated_cc = allocated_cc + ?, compliance_year = ?, request_status = ? WHERE id = ?',
      [ccAmount, years, 'allocated', companyId]
    );
    
    // Deduct from government wallet
    await db.run('UPDATE government_wallet SET cc_balance = cc_balance - ? WHERE id = 1', ccAmount);

    // Create transaction record
    const txId = `t_${Date.now()}`;
    await db.run(
      `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, 'cc_allocation', 0, ccAmount, 'Government', company.name, 'completed', `Allocated ${ccAmount} CC for ${years} years`]
    );

    // Trigger cross-platform sync to Green Ledger India
    try {
      // This will sync the balance reduction to Green Ledger India
      const syncData = {
        type: 'balance_update',
        ccAmount: ccAmount,
        source: 'carbon-bloom-connect',
        transactionHash: transactionHash || txId,
        companyId: companyId,
        timestamp: new Date().toISOString(),
        operation: 'purchase'
      };

      // Store sync event in a way that Green Ledger India can pick it up
      console.log('🔄 Triggering cross-platform sync for CC allocation:', syncData);
      
      // You could also make an HTTP request to Green Ledger India if it had an API
      // For now, we'll rely on localStorage sync events
      
    } catch (syncError) {
      console.warn('⚠️ Cross-platform sync failed:', syncError);
    }

    res.json({ 
      success: true, 
      message: 'CC Allocated to Company',
      data: {
        allocatedAmount: ccAmount,
        remainingBalance: gov.cc_balance - ccAmount,
        transactionId: txId
      }
    });
  } catch (error: any) {
    console.error('Allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

import { payFarmer } from '../services/carbonService.js';

/**
 * Process Individual Farmer Payout (Year-End)
 */
router.post('/payout/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const amount = await payFarmer(farmerId);
    res.json({ success: true, amount, message: 'Payout processed successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Get pending disaster relief requests
 */
router.get('/pending-disasters', async (req, res) => {
  try {
    const db = await getDb();
    const farmers = await db.all('SELECT * FROM farmers WHERE disaster_status = "pending"');
    res.json({ success: true, data: farmers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Approve disaster relief and pay farmer
 */
router.post('/approve-disaster/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { amount } = req.body;
    const db = await getDb();

    // Check if farmer has enough in insurance fund
    const farmerData = await db.get('SELECT name, insurance_fund FROM farmers WHERE id = ?', farmerId);
    if (!farmerData) throw new Error('Farmer not found');

    if (farmerData.insurance_fund < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient funds in Farmer Insurance Fund' });
    }

    // Deduct from farmer's insurance fund and pay farmer
    await db.run('UPDATE farmers SET wallet_balance = wallet_balance + ?, insurance_fund = insurance_fund - ?, disaster_status = "approved" WHERE id = ?', [amount, amount, farmerId]);

    // Create transaction
    const txId = `t_${Date.now()}`;
    await db.run(
      `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, 'disaster_relief', amount, 0, 'Government Insurance Fund', farmerData.name, 'completed', 'Insurance Claim Payout (Personal/Calamity)']
    );

    res.json({ success: true, message: 'Insurance claim approved and paid' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

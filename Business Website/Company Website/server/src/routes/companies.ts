import express from 'express';
import { getDb } from '../config/database.js';

const router = express.Router();

/**
 * Get all companies
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const companies = await db.all('SELECT * FROM companies');
    res.json({ success: true, data: companies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get company details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const company = await db.get('SELECT * FROM companies WHERE id = ?', id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Request CC Allocation
 */
router.post('/:id/request-cc', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const db = await getDb();

    await db.run(
      'UPDATE companies SET required_cc = ?, request_status = ?, status = ? WHERE id = ?',
      [amount, 'requested', 'verified', id]
    );

    res.json({ success: true, message: 'CC Request submitted to Government' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Buy CC (Company pays Government)
 */
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, ccAmount } = req.body; // amount is Rs, ccAmount is credits
    const db = await getDb();

    // Get company name for transaction
    const company = await db.get('SELECT name FROM companies WHERE id = ?', id);

    // Deduct from company and mark as paid (keep allocated_cc intact)
    await db.run(
      'UPDATE companies SET wallet_balance = wallet_balance - ?, payment_status = ?, request_status = ? WHERE id = ?',
      [amount, 'paid', 'none', id]
    );

    // Add to Gov Wallet (Money stored in Gov for farmers)
    await db.run('UPDATE government_wallet SET money_balance = money_balance + ? WHERE id = 1', amount);

    // Record Transaction
    const txId = `t_${Date.now()}`;
    await db.run(
      `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, 'cc_payment', amount, ccAmount, company.name, 'Government', 'completed', `Company funded ${ccAmount} CC allocation (₹${amount.toLocaleString()})`]
    );

    res.json({ success: true, message: 'Payment successful. Funds stored in Government wallet for farmers.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

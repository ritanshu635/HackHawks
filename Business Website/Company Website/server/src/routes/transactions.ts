import express from 'express';
import { getDb } from '../config/database.js';

const router = express.Router();

/**
 * Get all transactions with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, limit = 50 } = req.query;
    const db = await getDb();

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    }

    const transactions = await db.all(query, params);

    res.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get transaction by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', id);

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

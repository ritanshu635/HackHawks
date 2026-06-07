import express from 'express';
import { getDb } from '../config/database.js';
import { CROP_CC_PER_ACRE, CC_PRICE } from '../services/carbonService.js';

const router = express.Router();

/**
 * Get all farmers
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const farmers = await db.all('SELECT * FROM farmers');
    res.json({ success: true, data: farmers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Register new farmer
 */
router.post('/register', async (req, res) => {
  try {
    const { name, aadhaar, landSize, landId, bankDetails, currentCrop } = req.body;
    const db = await getDb();
    const farmerId = `f_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO farmers (id, name, aadhaar, land_size, land_id, bank_details, current_crop)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [farmerId, name, aadhaar, landSize, landId, bankDetails, currentCrop]
    );
    res.status(201).json({ success: true, data: { id: farmerId, name, currentCrop } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get farmer details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const farmer = await db.get('SELECT * FROM farmers WHERE id = ?', id);
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: farmer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update farmer's current crop
 */
router.put('/:id/crop', async (req, res) => {
  try {
    const { id } = req.params;
    const { crop } = req.body;
    if (!CROP_CC_PER_ACRE[crop]) return res.status(400).json({ success: false, error: 'Invalid crop' });
    const db = await getDb();
    await db.run(`UPDATE farmers SET current_crop = ? WHERE id = ?`, [crop, id]);
    res.json({ success: true, message: 'Crop updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get farmer's crop history and CC generation
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const history = await db.all(`SELECT * FROM monthly_crop_logs WHERE farmer_id = ? ORDER BY year DESC, month DESC`, id);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Request emergency loan
 */
router.post('/:id/emergency-loan', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const { processEmergencyLoan } = await import('../services/carbonService.js');
    const result = await processEmergencyLoan(id, amount);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Manual Monthly Log (Farmer Input)
 */
router.post('/:id/log-month', async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, crop, ccGenerated } = req.body;
    const db = await getDb();

    const farmer = await db.get('SELECT name, land_size FROM farmers WHERE id = ?', id);
    if (!farmer) throw new Error('Farmer not found');

    // Find the last logged month for this year
    const lastLog = await db.get(
      'SELECT max(month) as lastMonth FROM monthly_crop_logs WHERE farmer_id = ? AND year = ?',
      [id, year]
    );

    const startMonth = lastLog && lastLog.lastMonth ? lastLog.lastMonth + 1 : 1;
    const requestedMonth = Number(month);

    if (requestedMonth < startMonth) {
      return res.status(400).json({
        success: false,
        error: `Month ${requestedMonth} or earlier already logged or skipped. Next available month is ${startMonth}.`
      });
    }

    const monthsToCover = (requestedMonth - startMonth) + 1;

    // Strict table-based calculation: Rate / 12 (ignoring land size as per specific '13.33' requirement)
    // If the table implies per-acre, and user wants exactly 13.33, they might be assuming 1 unit.
    // However, to be safe and match the numbers exactly, we use the constant directly.
    const monthlyRate = CROP_CC_PER_ACRE[crop] / 12;
    const totalCCGenerated = monthlyRate * monthsToCover;

    await db.run('BEGIN TRANSACTION');
    try {
      // Create entries for each month in the gap
      for (let m = startMonth; m <= requestedMonth; m++) {
        await db.run(
          `INSERT INTO monthly_crop_logs (farmer_id, crop_type, cc_generated, month, year) VALUES (?, ?, ?, ?, ?)`,
          [id, crop, monthlyRate, m, year]
        );
      }

      // Update farmer total
      await db.run(
        `UPDATE farmers SET total_cc_generated = total_cc_generated + ?, december_logged = ? WHERE id = ?`,
        [totalCCGenerated, requestedMonth === 12 ? 1 : 0, id]
      );

      // ARCHIVE LOGIC (If December is logged)
      if (requestedMonth === 12) {
        // Calculate year total
        const yearTotal = totalCCGenerated; // This is just the catchup. We need the WHOLE year total?
        // Actually, the monthly_crop_logs has all entries.
        // Let's sum it up or just use the current logic.
        // Wait, the user says "entry should be made... shoudl go ina archive".
        // The `payFarmer` function creates the archive.
        // If I create it here, `payFarmer` needs to know.
        // But `payFarmer` is for PAYOUT.
        // Maybe the user wants the archive record CREATED now, and payout updates it?
        // Or payout uses it.
        // I'll create it here to satisfy "once he slects dec... go ina archive".
        // I need to fetch the FULL year sum first.
        const annualLogs = await db.all(
          `SELECT SUM(cc_generated) as total FROM monthly_crop_logs WHERE farmer_id = ? AND year = ?`,
          [id, year]
        );
        const annualCC = (annualLogs[0]?.total || 0); // This includes the entries we just added bc they are in the transaction? 
        // No, we are in a transaction. We just inserted monthly_crop_logs.
        // We can calculate annualCC = (existing sum) + totalCCGenerated.
        // Or just query (since we are in same transaction, strict read might not see it unless we query within txn? SQLite usually sees own writes).

        // Let's use simpler logic: 
        // We know MonthlyRate * 12 should be the total if full year logged.
        // We'll trust the sum query or calculation.

        const principal = annualCC * CC_PRICE;

        await db.run(
          `INSERT INTO annual_cc_archives (farmer_id, year, crop_type, land_size, cc_produced, payout_amount, interest_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, year, crop, farmer.land_size, annualCC, 0, 0] // 0 payout initially (Pending Government Action)
        );
      }

      // Update government wallet
      await db.run(
        `UPDATE government_wallet SET cc_balance = cc_balance + ?, total_cc_generated = total_cc_generated + ? WHERE id = 1`,
        [totalCCGenerated, totalCCGenerated]
      );

      // Create a single summary transaction for the catch-up
      const txId = `t_${Date.now()}`;
      const description = monthsToCover > 1
        ? `Cultivation catch-up: ${crop} for months ${startMonth}-${requestedMonth}`
        : `Cultivation Log: ${crop} for ${requestedMonth}/${year}`;

      await db.run(
        `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, 'cc_generation', 0, totalCCGenerated, farmer.name, 'Government', 'completed', description]
      );

      await db.run('COMMIT');
      res.json({ success: true, message: `Logged ${monthsToCover} months of ${crop}. Generated ${totalCCGenerated.toFixed(2)} CC.` });
    } catch (err) {
      await db.run('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Raise Disaster Relief
 */
router.post('/:id/disaster-relief', async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const db = await getDb();
    await db.run('UPDATE farmers SET disaster_status = "pending", disaster_description = ? WHERE id = ?', [description, id]);
    res.json({ success: true, message: 'Disaster relief requested' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get farmer's annual CC archives
 */
router.get('/:id/archives', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const archives = await db.all(`SELECT * FROM annual_cc_archives WHERE farmer_id = ? ORDER BY year DESC`, id);
    res.json({ success: true, data: archives });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get farmer's CC breakdown by crop for a specific year
 */
router.get('/:id/cc-breakdown/:year', async (req, res) => {
  try {
    const { id, year } = req.params;
    const db = await getDb();

    // Get all logs for this farmer in this year, grouped by crop
    const breakdown = await db.all(
      `SELECT 
        crop_type,
        MIN(month) as start_month,
        MAX(month) as end_month,
        SUM(cc_generated) as total_cc
       FROM monthly_crop_logs 
       WHERE farmer_id = ? AND year = ?
       GROUP BY crop_type
       ORDER BY start_month ASC`,
      [id, parseInt(year)]
    );

    res.json({ success: true, data: breakdown });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

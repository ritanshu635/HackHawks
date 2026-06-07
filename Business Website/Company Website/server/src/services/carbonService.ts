import { getDb } from '../config/database.js';

// Crop CC per acre per year
export const CROP_CC_PER_ACRE: Record<string, number> = {
  wheat: 160,
  cotton: 180,
  jowar: 200,
  mango: 400,
  teak: 360,
};

export const CC_PRICE = 2000; // ₹2000 per CC

/**
 * Calculate monthly CC for a farmer based on land size and crop
 */
export function calculateMonthlyCC(landSize: number, cropType: string): number {
  const yearlyCC = landSize * CROP_CC_PER_ACRE[cropType];
  return Math.round(yearlyCC / 12);
}

/**
 * Calculate yearly CC for a farmer
 */
export function calculateYearlyCC(landSize: number, cropType: string): number {
  return landSize * CROP_CC_PER_ACRE[cropType];
}

/**
 * Generate monthly CC for all farmers
 */
export async function generateMonthlyCC(): Promise<void> {
  const db = await getDb();

  // SQLite doesn't strictly need explicit transaction objects like MSSQL's pool.transaction()
  // We can just run BEGIN TRANSACTION
  await db.run('BEGIN TRANSACTION');

  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Get all farmers
    const farmers = await db.all('SELECT id, name, land_size, current_crop FROM farmers');

    let totalGenerated = 0;

    for (const farmer of farmers) {
      const monthlyCC = calculateMonthlyCC(farmer.land_size, farmer.current_crop);
      totalGenerated += monthlyCC;

      // Log monthly crop and CC generation
      await db.run(
        `INSERT INTO monthly_crop_logs (farmer_id, crop_type, cc_generated, month, year)
         VALUES (?, ?, ?, ?, ?)`,
        [farmer.id, farmer.current_crop, monthlyCC, month, year]
      );

      // Update farmer's total CC generated
      await db.run(
        `UPDATE farmers 
         SET total_cc_generated = total_cc_generated + ?
         WHERE id = ?`,
        [monthlyCC, farmer.id]
      );

      // Create transaction record
      const transactionId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.run(
        `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, 'cc_generation', 0, monthlyCC, farmer.name, 'Government CC Wallet', 'completed', `Monthly CC from ${farmer.current_crop} cultivation`]
      );
    }

    // Update government wallet
    await db.run(
      `UPDATE government_wallet 
       SET cc_balance = cc_balance + ?,
           total_cc_generated = total_cc_generated + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [totalGenerated, totalGenerated]
    );

    await db.run('COMMIT');
    console.log(`✅ Generated ${totalGenerated} CC for ${farmers.length} farmers`);
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

/**
 * Process emergency loan for farmer
 */
export async function processEmergencyLoan(
  farmerId: string,
  requestedAmount: number
): Promise<{ loanAmount: number; ccReserved: number; interest: number }> {
  const db = await getDb();
  await db.run('BEGIN TRANSACTION');

  try {
    // Get farmer details
    const farmer = await db.get('SELECT * FROM farmers WHERE id = ?', farmerId);

    if (!farmer) {
      throw new Error('Farmer not found');
    }

    // Calculate CC equivalent needed
    const ccReserved = Math.ceil(requestedAmount / CC_PRICE);

    // Calculate interest (10% annual interest on CC value)
    const interestRate = 10;
    const ccValue = ccReserved * CC_PRICE;
    const interest = Math.round(ccValue * (interestRate / 100));

    const currentYear = new Date().getFullYear();

    // Record emergency loan
    await db.run(
      `INSERT INTO emergency_loans (farmer_id, cc_reserved, loan_amount, interest_rate, total_interest, loan_year)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [farmerId, ccReserved, requestedAmount, interestRate, interest, currentYear]
    );

    // Update farmer wallet
    await db.run(
      `UPDATE farmers 
       SET wallet_balance = wallet_balance + ?
       WHERE id = ?`,
      [requestedAmount, farmerId]
    );

    // Update government wallet
    await db.run(
      `UPDATE government_wallet 
       SET money_balance = money_balance - ?
       WHERE id = 1`,
      [requestedAmount]
    );

    // Create transaction record
    const transactionId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, 'emergency_loan', requestedAmount, ccReserved, 'Government', farmer.name, 'completed', `Emergency loan against ${ccReserved} CC (${interestRate}% interest)`]
    );

    await db.run('COMMIT');

    return {
      loanAmount: requestedAmount,
      ccReserved,
      interest,
    };
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

/**
 * Pay an individual farmer
 */
export async function payFarmer(farmerId: string): Promise<number> {
  const db = await getDb();
  await db.run('BEGIN TRANSACTION');

  try {
    console.log(`[PAYOUT] Starting payout for farmer: ${farmerId}`);

    // Get farmer details
    const farmer = await db.get('SELECT * FROM farmers WHERE id = ?', farmerId);
    console.log(`[PAYOUT] Farmer data:`, farmer);

    if (!farmer) throw new Error('Farmer not found');
    if (!farmer.december_logged) throw new Error('December entry missing. Cannot settle year-end payout yet.');
    if (farmer.disaster_status === 'pending') throw new Error('Disaster claim pending. Settle claim before processing payout.');

    // ROBUST LOGIC: Detect the actual year the farmer completed (latest log)
    // Instead of relying on possibly-outdated sowing_year pointer.
    const lastLog = await db.get(
      `SELECT year FROM monthly_crop_logs WHERE farmer_id = ? ORDER BY year DESC, month DESC LIMIT 1`,
      [farmer.id]
    );
    const payoutYear = lastLog ? lastLog.year : farmer.sowing_year;
    console.log(`[PAYOUT] Detected Payout Year: ${payoutYear} (from logs)`);

    // Calculate CC produced in that specific year
    const annualLogs = await db.all(
      `SELECT SUM(cc_generated) as total FROM monthly_crop_logs WHERE farmer_id = ? AND year = ?`,
      [farmer.id, payoutYear]
    );
    const annualCC = annualLogs[0]?.total || 0;
    console.log(`[PAYOUT] Annual CC for year ${payoutYear}: ${annualCC}`);

    // Principal: CC produced * ₹2000
    const principal = annualCC * CC_PRICE;

    // Interest: 10% of principal is SAVED to the insurance fund
    const insuranceInterest = Math.round(principal * 0.10);

    // Additional disaster compensation if applicable (already in existing logic, but we'll stick to the user's specific request for the 10% fund)
    let disasterBonus = 0;
    if (farmer.disaster_status === 'approved') {
      disasterBonus = Math.round(principal * 0.08);
    }

    const totalPayout = principal + disasterBonus; // Principal goes to wallet
    console.log(`[PAYOUT] Total payout: ₹${totalPayout} (Principal: ₹${principal}, Disaster Bonus: ₹${disasterBonus}, Insurance Interest Saved: ₹${insuranceInterest})`);

    if (totalPayout > 0) {
      // Update farmer wallet
      await db.run(
        `UPDATE farmers SET 
          wallet_balance = wallet_balance + ?,
          insurance_fund = insurance_fund + ?,
          december_logged = 0,
          sowing_year = ? + 1,
          disaster_status = 'none'
         WHERE id = ?`,
        [totalPayout, insuranceInterest, payoutYear, farmer.id]
      );
      console.log(`[PAYOUT] Updated farmer wallet`);

      // Update or Create Archive Entry
      const existingArchive = await db.get(
        `SELECT id FROM annual_cc_archives WHERE farmer_id = ? AND year = ?`,
        [farmer.id, farmer.sowing_year]
      );

      if (existingArchive) {
        await db.run(
          `UPDATE annual_cc_archives 
           SET payout_amount = ?, interest_amount = ?, cc_produced = ?, crop_type = ?, land_size = ?
           WHERE id = ?`,
          [principal, insuranceInterest, annualCC, farmer.current_crop, farmer.land_size, existingArchive.id]
        );
        console.log(`[PAYOUT] Updated existing archive entry`);
      } else {
        await db.run(
          `INSERT INTO annual_cc_archives (farmer_id, year, crop_type, land_size, cc_produced, payout_amount, interest_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [farmer.id, farmer.sowing_year, farmer.current_crop, farmer.land_size, annualCC, principal, insuranceInterest]
        );
        console.log(`[PAYOUT] Created new archive entry`);
      }

      // Create transaction record
      const transactionId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const desc = disasterBonus > 0
        ? `Yearly Payout: ₹${principal.toLocaleString()} (CC) + ₹${disasterBonus.toLocaleString()} (Disaster Bonus). ₹${insuranceInterest.toLocaleString()} saved to Insurance Fund.`
        : `Yearly Payout: ₹${principal.toLocaleString()} for ${annualCC} CC Produced. ₹${insuranceInterest.toLocaleString()} saved to Insurance Fund.`;

      await db.run(
        `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, 'farmer_payment', totalPayout, annualCC, 'Government', farmer.name, 'completed', desc]
      );
      console.log(`[PAYOUT] Created transaction record`);

      // Update government wallet
      await db.run(
        `UPDATE government_wallet 
         SET money_balance = money_balance - ?,
             total_farmers_paid = total_farmers_paid + 1
         WHERE id = 1`,
        [totalPayout]
      );
      console.log(`[PAYOUT] Updated government wallet`);
    } else {
      console.log(`[PAYOUT] No payout needed (totalPayout = 0)`);
    }

    await db.run('COMMIT');
    console.log(`[PAYOUT] ✅ Payout completed successfully: ₹${totalPayout}`);
    return totalPayout;
  } catch (error) {
    console.error(`[PAYOUT] ❌ Error:`, error);
    await db.run('ROLLBACK');
    throw error;
  }
}

/**
 * Process CC expiry at year end
 */
export async function processYearEndExpiry(): Promise<number> {
  const db = await getDb();
  await db.run('BEGIN TRANSACTION');

  try {
    const currentDate = new Date().toISOString().split('T')[0];

    // Get all expired allocations
    const expiredAllocations = await db.all(
      `SELECT id, company_id, cc_amount, used_amount 
       FROM cc_allocations 
       WHERE expiry_date < ? AND status = 'active'`,
      currentDate
    );

    let totalExpired = 0;

    for (const allocation of expiredAllocations) {
      const unusedCC = allocation.cc_amount - allocation.used_amount;
      totalExpired += unusedCC;

      // Mark allocation as expired
      await db.run(
        `UPDATE cc_allocations 
         SET status = 'expired'
         WHERE id = ?`,
        allocation.id
      );
    }

    // Return expired CC to government wallet
    if (totalExpired > 0) {
      await db.run(
        `UPDATE government_wallet 
         SET cc_balance = cc_balance + ?,
             total_cc_expired = total_cc_expired + ?
         WHERE id = 1`,
        [totalExpired, totalExpired]
      );
    }

    await db.run('COMMIT');
    console.log(`✅ Processed ${totalExpired} expired CC`);

    return totalExpired;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

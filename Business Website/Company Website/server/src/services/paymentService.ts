import { razorpayInstance, CC_PRICE } from '../config/razorpay.js';
import { getDb } from '../config/database.js';
import crypto from 'crypto';

/**
 * Create Razorpay order for company CC payment
 */
export async function createPaymentOrder(
  companyId: string,
  ccAmount: number
): Promise<{ orderId: string; amount: number; currency: string }> {
  const amount = ccAmount * CC_PRICE * 100; // Convert to paise

  const options = {
    amount,
    currency: 'INR',
    receipt: `cc_${companyId}_${Date.now()}`,
    notes: {
      company_id: companyId,
      cc_amount: ccAmount,
      purpose: 'Carbon Credit Purchase',
    },
  };

  const order = await razorpayInstance.orders.create(options);

  // Store pending transaction
  const db = await getDb();
  const transactionId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.run(
    `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, razorpay_order_id, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transactionId, 'cc_payment', ccAmount * CC_PRICE, ccAmount, companyId, 'Government', 'pending', order.id, `Payment for ${ccAmount} carbon credits`]
  );

  return {
    orderId: order.id,
    amount: amount / 100,
    currency: order.currency,
  };
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Process successful payment
 */
export async function processSuccessfulPayment(
  orderId: string,
  paymentId: string,
  companyId: string
): Promise<void> {
  const db = await getDb();
  await db.run('BEGIN TRANSACTION');

  try {
    // Get transaction details
    const txn = await db.get(
      'SELECT * FROM transactions WHERE razorpay_order_id = ?',
      orderId
    );

    if (!txn) {
      throw new Error('Transaction not found');
    }

    // Update transaction status
    await db.run(
      `UPDATE transactions 
       SET status = 'completed', razorpay_payment_id = ?
       WHERE razorpay_order_id = ?`,
      [paymentId, orderId]
    );

    // Update government wallet
    await db.run(
      `UPDATE government_wallet 
       SET money_balance = money_balance + ?
       WHERE id = 1`,
      [txn.amount]
    );

    // Get company name for transaction record
    const company = await db.get('SELECT name FROM companies WHERE id = ?', companyId);
    const companyName = company?.name || companyId;

    // Create CC allocation transaction
    const allocationTxnId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentYear = new Date().getFullYear();
    const expiryDate = new Date(currentYear, 11, 31).toISOString().split('T')[0]; // Dec 31

    await db.run(
      `INSERT INTO transactions (id, type, amount, cc_amount, from_entity, to_entity, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [allocationTxnId, 'cc_allocation', txn.amount, txn.cc_amount, 'Government', companyName, 'completed', `Allocated ${txn.cc_amount} CC for compliance`]
    );

    // Create CC allocation record
    await db.run(
      `INSERT INTO cc_allocations (company_id, cc_amount, allocation_year, expiry_date)
       VALUES (?, ?, ?, ?)`,
      [companyId, txn.cc_amount, currentYear, expiryDate]
    );

    // Update company allocated CC
    await db.run(
      `UPDATE companies 
       SET allocated_cc = allocated_cc + ?
       WHERE id = ?`,
      [txn.cc_amount, companyId]
    );

    // Update government CC wallet
    await db.run(
      `UPDATE government_wallet 
       SET cc_balance = cc_balance - ?,
           total_cc_allocated = total_cc_allocated + ?
       WHERE id = 1`,
      [txn.cc_amount, txn.cc_amount]
    );

    await db.run('COMMIT');
    console.log(`✅ Payment processed for company ${companyId}: ${txn.cc_amount} CC`);
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

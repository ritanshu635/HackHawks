import express from 'express';
import { createPaymentOrder, verifyPaymentSignature, processSuccessfulPayment } from '../services/paymentService.js';
import { RAZORPAY_KEY_ID } from '../config/razorpay.js';

const router = express.Router();

/**
 * Get Razorpay key for frontend
 */
router.get('/key', (req, res) => {
  res.json({ success: true, key: RAZORPAY_KEY_ID });
});

/**
 * Create payment order for company CC purchase
 */
router.post('/create-order', async (req, res) => {
  try {
    const { companyId, ccAmount } = req.body;

    if (!companyId || !ccAmount || ccAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters'
      });
    }

    const order = await createPaymentOrder(companyId, ccAmount);

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify payment and process CC allocation
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      companyId
    } = req.body;

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Process successful payment
    await processSuccessfulPayment(
      razorpay_order_id,
      razorpay_payment_id,
      companyId
    );

    res.json({
      success: true,
      message: 'Payment verified and CC allocated successfully'
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Webhook endpoint for Razorpay
 */
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret) {
      const signature = req.headers['x-razorpay-signature'];
      // Verify webhook signature here if needed
    }

    const event = req.body;

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

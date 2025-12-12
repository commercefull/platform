/**
 * Payment Business Router
 */

import express from 'express';
import * as paymentController from '../controllers/PaymentController';
import * as fraudController from '../controllers/fraudController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isMerchantLoggedIn);

/**
 * List all transactions
 * GET /api/admin/payments/transactions
 */
router.get('/transactions', paymentController.listTransactions);

/**
 * Get transaction details
 * GET /api/admin/payments/transactions/:transactionId
 */
router.get('/transactions/:transactionId', paymentController.getTransaction);

/**
 * Initiate a payment
 * POST /api/admin/payments/transactions
 */
router.post('/transactions', paymentController.initiatePayment);

/**
 * Get refunds for a transaction
 * GET /api/admin/payments/transactions/:transactionId/refunds
 */
router.get('/transactions/:transactionId/refunds', paymentController.getRefunds);

/**
 * Process refund
 * POST /api/admin/payments/transactions/:transactionId/refund
 */
router.post('/transactions/:transactionId/refund', paymentController.processRefund);

// Fraud Prevention routes
router.get('/fraud/rules', fraudController.getFraudRules);
router.get('/fraud/rules/:id', fraudController.getFraudRule);
router.post('/fraud/rules', fraudController.createFraudRule);
router.put('/fraud/rules/:id', fraudController.updateFraudRule);
router.delete('/fraud/rules/:id', fraudController.deleteFraudRule);

router.get('/fraud/checks', fraudController.getFraudChecks);
router.get('/fraud/checks/:id', fraudController.getFraudCheck);
router.get('/fraud/reviews', fraudController.getPendingReviews);
router.post('/fraud/checks/:id/review', fraudController.reviewFraudCheck);

router.get('/fraud/blacklist', fraudController.getBlacklist);
router.post('/fraud/blacklist', fraudController.addToBlacklist);
router.delete('/fraud/blacklist/:id', fraudController.removeFromBlacklist);

export const paymentBusinessRouter = router;
export default router;

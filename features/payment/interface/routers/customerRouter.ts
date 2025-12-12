/**
 * Payment Customer Router
 */

import express from 'express';
import * as paymentController from '../controllers/PaymentController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

/**
 * Get available payment methods
 * GET /api/payments/methods
 */
router.get('/methods', paymentController.getPaymentMethods);

// Protected routes
router.use(isCustomerLoggedIn);

/**
 * Get my transactions
 * GET /api/payments/transactions
 */
router.get('/transactions', paymentController.getMyTransactions);

/**
 * Get transactions for an order
 * GET /api/payments/orders/:orderId
 */
router.get('/orders/:orderId', paymentController.getTransactionByOrder);

export const paymentCustomerRouter = router;
export default router;

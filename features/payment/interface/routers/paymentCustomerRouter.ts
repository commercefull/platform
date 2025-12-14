/**
 * Payment Customer Router
 */

import express from 'express';
import * as paymentController from '../controllers/PaymentController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Protected routes
router.use(isCustomerLoggedIn);

/**
 * Get available payment methods
 * GET /api/payments/methods
 */
router.get('/payment/methods', paymentController.getPaymentMethods);

/**
 * Get my transactions
 * GET /api/payments/transactions
 */
router.get('/payment/transactions', paymentController.getMyTransactions);

/**
 * Get transactions for an order
 * GET /api/payments/orders/:orderId
 */
router.get('/payment/orders/:orderId', paymentController.getTransactionByOrder);

export const paymentCustomerRouter = router;

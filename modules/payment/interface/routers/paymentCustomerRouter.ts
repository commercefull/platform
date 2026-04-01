/**
 * Payment Customer Router
 */

import express from 'express';
import * as paymentController from '../controllers/PaymentController';
import * as paymentCustomerController from '../controllers/paymentCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Protected routes
router.use('/payment/transactions', isCustomerLoggedIn);

/**
 * Get available payment methods
 * GET /payments/methods
 */
router.get('/payment/methods', paymentController.getPaymentMethods);

/**
 * Get my transactions
 * GET /payments/transactions
 */
router.get('/payment/transactions', paymentController.getMyTransactions);

/**
 * Get transactions for an order
 * GET /payments/orders/:orderId
 */
router.get('/payment/orders/:orderId', paymentController.getTransactionByOrder);

// ============================================================================
// Stored Payment Methods (protected)
// ============================================================================
router.use('/payment-methods', isCustomerLoggedIn);

router.get('/payment-methods', paymentCustomerController.listStoredMethods);
router.post('/payment-methods', paymentCustomerController.saveStoredMethod);
router.post('/payment-methods/:methodId/default', paymentCustomerController.setDefaultMethod);
router.delete('/payment-methods/:methodId', paymentCustomerController.deleteStoredMethod);

export const paymentCustomerRouter = router;

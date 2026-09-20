/**
 * Payment Customer Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as paymentController from '../controllers/PaymentController';
import * as paymentCustomerController from '../controllers/paymentCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Protected routes
router.use('/payment/transactions', isCustomerLoggedIn);

/**
 * Get available payment methods
 * GET /payments/methods
 */
router.get('/payment/methods', asyncHandler(paymentController.getPaymentMethods));

/**
 * Get my transactions
 * GET /payments/transactions
 */
router.get('/payment/transactions', asyncHandler(paymentController.getMyTransactions));

/**
 * Get transactions for an order
 * GET /payments/orders/:orderId
 */
router.get('/payment/orders/:orderId', asyncHandler(paymentController.getTransactionByOrder));

// ============================================================================
// Stored Payment Methods (protected)
// ============================================================================
router.use('/payment-methods', isCustomerLoggedIn);

router.get('/payment-methods', asyncHandler(paymentCustomerController.listStoredMethods));
router.post('/payment-methods', asyncHandler(paymentCustomerController.saveStoredMethod));
router.post('/payment-methods/:methodId/default', asyncHandler(paymentCustomerController.setDefaultMethod));
router.delete('/payment-methods/:methodId', asyncHandler(paymentCustomerController.deleteStoredMethod));

export const paymentCustomerRouter = router;

/**
 * Payment Customer Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getMyTransactions,
  getPaymentMethods,
  getTransactionByOrder,
} from '../controllers/PaymentController';
import {
  deleteStoredMethod,
  listStoredMethods,
  saveStoredMethod,
  setDefaultMethod,
} from '../controllers/paymentCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Protected routes
router.use('/payment/transactions', isCustomerLoggedIn);

/**
 * Get available payment methods
 * GET /payments/methods
 */
router.get('/payment/methods', asyncHandler(getPaymentMethods));

/**
 * Get my transactions
 * GET /payments/transactions
 */
router.get('/payment/transactions', asyncHandler(getMyTransactions));

/**
 * Get transactions for an order
 * GET /payments/orders/:orderId
 */
router.get('/payment/orders/:orderId', asyncHandler(getTransactionByOrder));

// ============================================================================
// Stored Payment Methods (protected)
// ============================================================================
router.use('/payment-methods', isCustomerLoggedIn);

router.get('/payment-methods', asyncHandler(listStoredMethods));
router.post('/payment-methods', asyncHandler(saveStoredMethod));
router.post('/payment-methods/:methodId/default', asyncHandler(setDefaultMethod));
router.delete('/payment-methods/:methodId', asyncHandler(deleteStoredMethod));

export const paymentCustomerRouter = router;

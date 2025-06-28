import express from 'express';
import {
  getActivePaymentMethods,
  getCustomerTransactions,
  getTransactionDetails,
  requestRefund,
  getTransactionRefunds
} from './controllers/paymentStorefrontController';

const router = express.Router();

// Public payment method routes
router.get('/payment-methods', getActivePaymentMethods);

// Customer transaction routes
router.get('/customers/:customerId/transactions', getCustomerTransactions);

// Transaction routes
router.get('/transactions/:transactionId', getTransactionDetails);
router.get('/transactions/:transactionId/refunds', getTransactionRefunds);
router.post('/transactions/:transactionId/refunds', requestRefund);

export const paymentStorefrontRouter = router;


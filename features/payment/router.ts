import express from 'express';
import paymentPublicController from './controllers/paymentPublicController';

const router = express.Router();

// Public payment method routes
router.get('/payment-methods', paymentPublicController.getActivePaymentMethods);

// Customer transaction routes
router.get('/customers/:customerId/transactions', paymentPublicController.getCustomerTransactions);

// Transaction routes
router.get('/transactions/:transactionId', paymentPublicController.getTransactionDetails);
router.get('/transactions/:transactionId/refunds', paymentPublicController.getTransactionRefunds);
router.post('/transactions/:transactionId/refunds', paymentPublicController.requestRefund);

export default router;

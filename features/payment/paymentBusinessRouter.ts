import express from 'express';
import {
  getGateways,
  getGatewayById,
  createGateway,
  updateGateway,
  deleteGateway,
  getMethodConfigs,
  getMethodConfigById,
  createMethodConfig,
  updateMethodConfig,
  deleteMethodConfig,
  getTransactionById,
  getTransactionsByOrderId,
  updateTransaction,
  getRefundById,
  getRefundsByTransactionId,
  createRefund,
  updateRefund
} from './controllers/paymentBusinessController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

// Payment Gateway Routes
router.get('/merchants/:merchantId/gateways', getGateways);
router.get('/gateways/:id', getGatewayById);
router.post('/gateways', createGateway);
router.put('/gateways/:id', updateGateway);
router.delete('/gateways/:id', deleteGateway);

// Payment Method Config Routes
router.get('/merchants/:merchantId/method-configs', getMethodConfigs);
router.get('/method-configs/:id', getMethodConfigById);
router.post('/method-configs', createMethodConfig);
router.put('/method-configs/:id', updateMethodConfig);
router.delete('/method-configs/:id', deleteMethodConfig);

// Transaction Routes
router.get('/transactions/:id', getTransactionById);
router.get('/orders/:orderId/transactions', getTransactionsByOrderId);
router.put('/transactions/:id', updateTransaction);

// Refund Routes
router.get('/refunds/:id', getRefundById);
router.get('/transactions/:transactionId/refunds', getRefundsByTransactionId);
router.post('/refunds', createRefund);
router.put('/refunds/:id', updateRefund);

export const paymentMerchantRouter = router;
